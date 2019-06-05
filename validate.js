/*jshint esversion: 6 */

var yaml = require("js-yaml");
(fs = require("fs")), (_ = require("underscore"));

const { createCanvas, registerFont } = require("canvas");

TEXTS = yaml.safeLoad(require("fs").readFileSync("text.yml", "utf8"));

TEXTS = _.flatten(TEXTS);

console.log(TEXTS.join("\n"));

var longestString = TEXTS.sort(function(a, b) {
  return b.length - a.length;
})[0];
console.log(
  "Longest string (" + longestString.length + ") is: \n" + longestString
);

validationPage =
  "<!DOCTYPE html><html><head><title>Validation</title></head><body>";

images = [];
_.each(TEXTS, function(text) {
  var canvas = createCanvas(640, 80),
    ctx = canvas.getContext("2d");

  ctx.font = "30px Lusitana Bold";
  ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
  ctx.fillText(text, 10, 25);

  content = canvas.toDataURL();
  image = '<img src="' + content + '">';
  images.push(image);
});

validationPage += images.join("\n") + "</body></html>";

fs.writeFileSync("validation.html", validationPage);
