var yaml = require('js-yaml');
    fs   = require('fs'),
    _    = require('underscore');

const { createCanvas, registerFont } = require('canvas');

TEXTS = yaml.safeLoad(require('fs').readFileSync('text.yml', 'utf8'));

TEXTS = _.flatten(TEXTS);

console.log(TEXTS.join("\n"))
validation_page = "<!DOCTYPE html><html><head><title>Validation</title></head><body>";

images = [];
_.each(TEXTS, function(text) {
  var canvas = createCanvas(640, 130),
      ctx = canvas.getContext('2d');

  ctx.font = '30px Lusitana Bold';
  ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
  ctx.fillText(text, 10, 60);

  content = canvas.toDataURL();
  image = "<img src=\"" + content + "\">";
  images.push(image);
});

validation_page += images.join("\n") + "</body></html>";

fs.writeFileSync("validation.html", validation_page);
