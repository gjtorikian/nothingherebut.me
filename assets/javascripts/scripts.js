
document.addEventListener("DOMContentLoaded", function(event) {
  var ONE_SECOND = 1000;

  function properIsoString(date) {
      var pad = function(num) {
              var norm = Math.floor(Math.abs(num));
              return (norm < 10 ? '0' : '') + norm;
          };
      return date.getFullYear() +
          '-' + pad(date.getMonth() + 1) +
          '-' + pad(date.getDate()) +
          ' ' + pad(date.getHours()) +
          ':' + pad(date.getMinutes()) +
          ':' + pad(date.getSeconds())
  }

  // compatible with IE7+, Firefox, Chrome, Opera, Safari
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      response = JSON.parse(xmlhttp.responseText);
      timeUntilNext = response.times.minutesUntilNextStory + ":" + response.times.secondsUntilNextStory;
      document.getElementById("nextTime").innerHTML = timeUntilNext;
      timeForThis = response.times.minutesForThisStory + ":" + response.times.secondsForThisStory;
      document.getElementById("thisTime").innerHTML = timeForThis;
      document.getElementById("path").innerHTML = response.path;
      document.getElementById("canvas").setAttribute("src", response.canvas);
    }
  };
  function fetchAndReplaceData() {
    data = { date: properIsoString(new Date()) };
    xmlhttp.open("POST", "/data", true);
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlhttp.send(JSON.stringify(data));
  }

  function repeatEvery(func, interval) {
    // Check current time and calculate the delay until next interval
    var now = new Date(),
        delay = interval - now % interval;

    function start() {
        // Execute function now...
        func();
        // ... and every interval
        setInterval(func, interval);
    }

    // Delay execution until it's an even interval
    setTimeout(start, delay);
}

repeatEvery(fetchAndReplaceData, ONE_SECOND);
});
