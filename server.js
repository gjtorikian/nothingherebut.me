/*jshint esversion: 6 */

var express = require('express'),
    app = express(),
    path    = require('path'),
    bodyParser = require('body-parser'),
    get_ip = require('ipware')().get_ip,
    geoip = require('geoip-lite'),
    yaml = require('js-yaml'),
    fs   = require('fs'),
    moment = require('moment');

const { createCanvas, registerFont } = require('canvas');
const port = process.env.PORT || 8888;

registerFont('public/assets/fonts/Lusitana-Bold.ttf', { family: 'Lusitana Bold', weight: 'Bold' });

TEXTS = yaml.safeLoad(require('fs').readFileSync('text.yml', 'utf8'));

// returns the index in the stored array
function hourToIndex(hour) {
  return hour % 8;
}

app.use(bodyParser.json());
app.use(express.static('./public'));
app.use('/', express.static('views'));

app.get('/', function(req, res) {
  // on load, calculate the lat and long of the vistor
  var ip_info = get_ip(req);
  var client_ip = ip_info.clientIp;
  var geo = geoip.lookup(client_ip);
  if (geo === null) {
    geo = geoip.lookup("52.173.133.217"); // no IP? give 'em somewhere in Des Moines.
  }
  app.locals.latitude = geo.ll[0];
  app.locals.longitude = geo.ll[1];

  res.sendFile(path.join(__dirname +' /index.html'));
});

app.post('/data', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  var first_index = 0, second_index = 0;

  // southern hemisphere is [-90, 0)
  // northern hemisphere is [0, 90]
  // "8 or 9" is the index in the first north/south nested array
  first_index = app.locals.latitude >= 0 ? 9 : 8;
  // western hemisphere is [-180, 0)
  // eastern hemisphere is [0, 180]
  // "8 or 9" is the index in the second east/west nested array
  second_index = app.locals.longitude >= 0 ? 9 : 8;

  // adjust to user's local timezone
  var clientDate = moment(req.body.date);

  var gmt = moment().utc();
  var future_gmt = moment(gmt).add(14, 'hours');
  var past_gmt = moment(gmt).subtract(12, 'hours');
  var valid = moment(clientDate).isBetween(past_gmt, future_gmt);

  var curr_hour = clientDate.hours();
  var next_hour = curr_hour + 1;
  var phrase_one = "", phrase_two = "";

  if (valid) {
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
  }
  else {
    phrase_one = phrase_two = "INVALID\nDATE."
  }

  var times = calculateTimes(clientDate);
  var first_alpha = calculateAlpha(times.minutesUntilNextStory, times.secondsUntilNextStory);
  var second_alpha = calculateAlpha(times.minutesForThisStory, times.secondsForThisStory);
  var canvas = calculateTexts(phrase_one, first_alpha, phrase_two, second_alpha);
  var data = {
    times: times,
    canvas: canvas.toDataURL()
  };

  res.json(data);
});

function calculateTimes(clientDate) {
  var time = {};

  var minutesUntilNextStory = 60 - clientDate.minutes();
  if (minutesUntilNextStory == 60) {
    minutesUntilNextStory = 0;
  }
  var secondsUntilNextStory = 60 - clientDate.seconds();
  if (secondsUntilNextStory == 60) {
    secondsUntilNextStory = 0;
  }
  time.minutesUntilNextStory = paddedTime(minutesUntilNextStory);
  time.secondsUntilNextStory = paddedTime(secondsUntilNextStory);
  var minutesForThisStory = clientDate.minutes();
  var secondsForThisStory = clientDate.seconds();
  time.minutesForThisStory = paddedTime(minutesForThisStory);
  time.secondsForThisStory = paddedTime(secondsForThisStory);

  return time;
}

function calculateTexts(phrase_one, phrase_one_alpha, phrase_two, phrase_two_alpha) {
  var canvas = createCanvas(640, 130),
      ctx = canvas.getContext('2d');

  ctx.font = '30px Lusitana Bold';
  ctx.fillStyle = "rgba(0, 0, 0 " + phrase_one_alpha + ")";
  if (phrase_one != undefined)
    ctx.fillText(phrase_one, 10, 60);

  ctx.fillStyle = "rgba(0, 0, 0, " + phrase_two_alpha + ")";
  if (phrase_two != undefined)
    ctx.fillText(phrase_two, 10, 60);

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
function calculateAlpha(m, s) {
  // we may have padded this into a string via `paddedTime` :(
  var minutes = Number(m),
      seconds = Number(s);
  return Number( ( (minutes * 60) + seconds) / 3600).toFixed(2);
}

app.listen(port, () => {
  console.log("App is running on PORT: ", port);
});
