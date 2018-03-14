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
    else if (arr[i].length > 140) {
      errors.push("This line is too long: " + arr[i]);
    }
  }
}

parseArray(TEXTS, errors);

if (errors.length > 0) {
  console.error("The following errors were found: \n");
  console.error(errors.join("\n\n"));
}
else {
  console.log("Everything looks great!");
}
