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
  var ipInfo = get_ip(req);
  var client_ip = ipInfo.clientIp;
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

  var firstIndex = 0, secondIndex = 0;

  // southern hemisphere is [-90, 0)
  // northern hemisphere is [0, 90]
  // "8 or 9" is the index in the first north/south nested array
  firstIndex = app.locals.latitude >= 0 ? 9 : 8;
  // western hemisphere is [-180, 0)
  // eastern hemisphere is [0, 180]
  // "8 or 9" is the index in the second east/west nested array
  secondIndex = app.locals.longitude >= 0 ? 9 : 8;

  // adjust to user's local timezone
  var clientDate = moment(req.body.date);

  var gmt = moment().utc();
  var futureGMT = moment(gmt).add(14, 'hours');
  var pastGMT = moment(gmt).subtract(12, 'hours');
  var valid = moment(clientDate).isBetween(pastGMT, futureGMT);

  var weekOfYear = weekOfMonth(gmt);//moment().week();
  var currHour = clientDate.hours();
  var nextHour = currHour + 1;
  var phraseOne = "", phraseTwo = "";

  if (valid) {
    if (currHour >= 0 && currHour < 7){
      phraseOne = TEXTS[hourToIndex(currHour)];
      phraseTwo = TEXTS[hourToIndex(nextHour)];
    }
    else if (currHour == 7) {
      phraseOne = TEXTS[hourToIndex(currHour)];
      phraseTwo = TEXTS[firstIndex][hourToIndex(nextHour)];
    }
    else if (currHour >= 8 && currHour < 15) {
      phraseOne = TEXTS[firstIndex][hourToIndex(currHour)];
      phraseTwo = TEXTS[firstIndex][hourToIndex(nextHour)];
    }
    else if (currHour == 15) {
      phraseOne = TEXTS[firstIndex][hourToIndex(currHour)];
      phraseTwo = TEXTS[firstIndex][secondIndex][hourToIndex(nextHour)];
    }
    else if (currHour >= 16 && currHour < 24) {
      phraseOne = TEXTS[firstIndex][secondIndex][hourToIndex(currHour)];
      phraseTwo = TEXTS[firstIndex][secondIndex][hourToIndex(nextHour)];
    }
  }
  else {
    phraseOne = phraseTwo = "INVALID\nDATE.";
  }

  var times = calculateTimes(clientDate);
  var firstAlpha = calculateAlpha(times.minutesUntilNextStory, times.secondsUntilNextStory);
  var secondAlpha = calculateAlpha(times.minutesForThisStory, times.secondsForThisStory);
  var canvas = calculateTexts(phraseOne, firstAlpha, phraseTwo, secondAlpha);
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

function calculateTexts(phraseOne, phraseOneAlpha, phraseTwo, phraseTwoAlpha) {
  var canvas = createCanvas(640, 130),
      ctx = canvas.getContext('2d');

  ctx.font = '30px Lusitana Bold';
  ctx.fillStyle = "rgba(0, 0, 0, " + phraseOneAlpha + ")";
  if (phraseOne != undefined)
    ctx.fillText(phraseOne, 10, 60);

  ctx.fillStyle = "rgba(0, 0, 0, " + phraseTwoAlpha + ")";
  if (phraseTwo != undefined)
    ctx.fillText(phraseTwo, 10, 60);

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

// grab week number relative to month
function weekOfMonth(m) {
  return m.week() - moment(m).startOf('month').week() + 1;
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
