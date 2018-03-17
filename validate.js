var yaml = require('js-yaml');
    fs   = require('fs');

TEXTS = yaml.safeLoad(require('fs').readFileSync('text.yml', 'utf8'));

var errors = [];

function parseArray(arr, errors) {
  var i = 0;
  for (i; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      parseArray(arr[i], errors);
    }
    else {
      var text = arr[i].split("\n")
      if (text[1] === undefined) {
        text.push(""); // i am lazy
      }
      // 45 chars seems to be a nice line length for the canvas
      if (text[0].length > 45) {
        errors.push("This line is too long: " + text[0]);
      }
      else if (text[1].length > 45) {
        errors.push("This line is too long: " + text[1]);
      }
    }
  }
}

parseArray(TEXTS, errors);

if (errors.length > 0) {
  console.error("The following " + errors.length + " errors were found: \n");
  console.error(errors.join("\n\n"));
}
else {
  console.log("Everything looks great!");
}
