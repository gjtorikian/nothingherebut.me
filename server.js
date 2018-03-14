/*jshint esversion: 6 */

var express = require('express'),
    http = require('http'),
    app = express(),
    compileSass = require('express-compile-sass'),
    get_ip = require('ipware')().get_ip,
    geoip = require('geoip-lite'),
    yaml = require('js-yaml'),
    fs   = require('fs');

const { createCanvas, registerFont } = require('canvas');
const port = process.env.PORT || 8888;

registerFont('public/assets/fonts/Lusitana-Bold.ttf', { family: 'Lusitana Bold', weight: 'Bold' });

TEXTS = yaml.safeLoad(require('fs').readFileSync('text.yml', 'utf8'));

app.use(express.static('./public'));
app.set('view engine', 'pug')

app.get('/', function(req, res) {
  var canvas = calculateTexts();
  var time = calculateTimes();

  res.render('index', {
    canvas: canvas.toDataURL(),
    thisTime: time.minutesForThisStory + ":" + time.secondsForThisStory,
    nextTime: time.minutesUntilNextStory + ":" + time.secondsUntilNextStory,
  });
});

app.get('/data', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  var ip_info = get_ip(req);

  var geo = geoip.lookup(ip_info.clientIp);

  var data = {
    times: calculateTimes(),
    canvas: calculateTexts().toDataURL()
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

function calculateTexts() {
  var canvas = createCanvas(800, 100),
      ctx = canvas.getContext('2d');

  var sec = new Date().getSeconds();
  ctx.font = '45px Lusitana Bold';
  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
  ctx.fillText("Awesome", 300, 100);

  ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
  ctx.fillText(sec.toString(), 300, 100);

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

function calculateAlpha(minutes, seconds) {

}

app.listen(port, () => {
    console.log("App is running on PORT: ", port);
})
