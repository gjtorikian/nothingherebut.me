/*jshint esversion: 6 */

var express = require('express'),
    app = express(),
    get_ip = require('ipware')().get_ip,
    geoip = require('geoip-lite'),
    yaml = require('js-yaml'),
    fs   = require('fs');

const { createCanvas, registerFont } = require('canvas');
const port = process.env.PORT || 8888;

registerFont('public/assets/fonts/Lusitana-Bold.ttf', { family: 'Lusitana Bold', weight: 'Bold' });

TEXTS = yaml.safeLoad(require('fs').readFileSync('text.yml', 'utf8'));

// returns the index in the story array
function hourToIndex(hour) {
  return hour % 8;
}

app.use(express.static('./public'));
app.set('view engine', 'pug')

app.get('/', function(req, res) {
  var canvas = calculateTexts();
  var time = calculateTimes();

  // on load, calculate the lat and long of the vistor
  var ip_info = get_ip(req);
  var client_ip = ip_info.clientIp;
  var geo = geoip.lookup(client_ip);
  if (geo === null) {
    geo = geoip.lookup("52.173.133.217"); // somewhere in Des Moines.
  }
  app.locals.latitude = geo.ll[0];
  app.locals.longitude = geo.ll[1];

  res.render('index', {
    canvas: canvas.toDataURL(),
    thisTime: time.minutesForThisStory + ":" + time.secondsForThisStory,
    nextTime: time.minutesUntilNextStory + ":" + time.secondsUntilNextStory,
  });
});

app.get('/data', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  var first_index = 0, second_index = 0;

  // southern hemisphere is [-90, 0)
  // northern hemisphere is [0, 90]
  // "8 or 9" is the index in the nested array
  first_index = app.locals.latitude >= 0 ? 9 : 8;
  // western hemisphere is [-180, 0)
  // eastern hemisphere is [0, 180]
  // "8 or 9" is the index in the nested array
  second_index = app.locals.longitude >= 0 ? 9 : 8;

  var curr_hour = new Date().getHours();
  var next_hour = curr_hour + 1;
  var phrase_one = "", phrase_two = "";

  if (curr_hour >= 0 && curr_hour < 7){
    phrase_one = TEXTS[hourToIndex(curr_hour)];
    phrase_two = TEXTS[hourToIndex(next_hour)];
  }
  else if (curr_hour == 7) {
    phrase_one = TEXTS[hourToIndex(curr_hour)];
    phrase_two = TEXTS[first_index][hourToIndex(next_hour)];
  }
  else if (curr_hour >= 8 && curr_hour < 15) {
    phrase_one = TEXTS[first_index][hourToIndex(curr_hour)];
    phrase_two = TEXTS[first_index][hourToIndex(next_hour)];
  }
  else if (curr_hour == 15) {
    phrase_one = TEXTS[first_index][hourToIndex(curr_hour)];
    phrase_two = TEXTS[first_index][second_index][hourToIndex(next_hour)];
  }
  else if (curr_hour >= 16 && curr_hour < 24) {
    phrase_one = TEXTS[first_index][second_index][hourToIndex(curr_hour)];
    phrase_two = TEXTS[first_index][second_index][hourToIndex(next_hour)];
  }

  var times = calculateTimes();
  var first_alpha = calculateAlpha(times.minutesUntilNextStory, times.secondsUntilNextStory);
  var second_alpha = calculateAlpha(times.minutesForThisStory, times.secondsForThisStory);
  var canvas = calculateTexts(phrase_one, first_alpha, phrase_two, second_alpha);
  var data = {
    times: times,
    canvas: canvas.toDataURL()
  };

  res.json(data);
});

function calculateTimes() {
  var time = {};

  var minutesUntilNextStory = 60 - new Date().getMinutes();
  var secondsUntilNextStory = 60 - new Date().getSeconds();
  time.minutesUntilNextStory = paddedTime(minutesUntilNextStory);
  time.secondsUntilNextStory = paddedTime(secondsUntilNextStory);
  var minutesForThisStory = new Date().getMinutes();
  var secondsForThisStory = new Date().getSeconds();
  time.minutesForThisStory = paddedTime(minutesForThisStory);
  time.secondsForThisStory = paddedTime(secondsForThisStory);

  return time;
}

function calculateTexts(phrase_one, phrase_one_alpha, phrase_two, phrase_two_alpha) {
  var canvas = createCanvas(1120, 100),
      ctx = canvas.getContext('2d');

  ctx.font = '35px Lusitana Bold';
  ctx.fillStyle = "rgba(238, 7, 1 " + phrase_one_alpha + ")";
  if (phrase_one != undefined)
    ctx.fillText(phrase_one, 100, 30);

  ctx.fillStyle = "rgba(112, 87, 255, " + phrase_two_alpha + ")";
  if (phrase_two != undefined)
    ctx.fillText(phrase_two, 100, 30);

  return canvas;
}

function paddedTime(time) {
  if (time < 10) {
    return "0" + time;
  }
  else {
    return time;
  }
}

// some range between 0 and 3600 representing the 0 to 1.0 alpha range
function calculateAlpha(minutes, seconds) {
  return Number( ( (minutes * 60) + seconds) / 3600).toFixed(2);
}

app.listen(port, () => {
  console.log("App is running on PORT: ", port);
});
