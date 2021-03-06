/*jshint esversion: 6 */

const express = require("express"),
  app = express(),
  path = require("path"),
  bodyParser = require("body-parser"),
  maxmind = require("maxmind"),
  yaml = require("js-yaml"),
  moment = require("moment-timezone"),
  SunCalc = require("suncalc"),
  tzlookup = require("tz-lookup");

const { createCanvas, registerFont } = require("canvas");
const port = process.env.PORT || 8888;

registerFont("./public/assets/fonts/Lusitana-Bold.ttf", {
  family: "Lusitana Bold",
  weight: "Bold"
});

TEXTS = yaml.safeLoad(require("fs").readFileSync("text.yml", "utf8"));

const Region = {
  NORTHWEST: 0,
  NORTHEAST: 1,
  SOUTHWEST: 3,
  SOUTHEAST: 3
};

app.use(bodyParser.json());
app.use(express.static("./public"));

app.get("/", function(req, res) {
  // on load, calculate the lat and long of the visitor
  // based on IP
  var ip = req.header("x-forwarded-for") || req.connection.remoteAddress;
  maxmind.open("GeoIP2-City.mmdb", function(err, cityLookup) {
    if (err || ip === undefined) {
      console.error(ip);
    } else {
      data = cityLookup.get("108.46.250.180");
      location = data.location;
      if (data.location !== undefined) {
        app.locals.latitude = data.location.latitude;
        app.locals.longitude = data.location.longitude;
      }
    }

    if (
      app.locals.latitude === undefined ||
      app.locals.longitude === undefined
    ) {
      // give 'em somewhere in New Yawk
      app.locals.latitude = 40.6617;
      app.locals.longitude = -73.9855;
    }

    res.sendFile(path.join(__dirname + "/views/index.html"));
  });
});

app.post("/data", function(req, res) {
  res.setHeader("Content-Type", "application/json");

  var firstIndex = 0,
    secondIndex = 0;
  var phraseOne = "",
    phraseTwo = "";
  var latitude = app.locals.latitude,
    longitude = app.locals.longitude;

  // adjust to user's local timezone
  var timezone = tzlookup(latitude, longitude);
  var regionDate = moment().tz(timezone);
  var utcOffset = regionDate.utcOffset();
  var regionLocation = "";
  var path = "";
  var indices = [];
  var valid = checkValidity(regionDate);

  if (valid) {
    regionLocation = calculateRegion(latitude, longitude);
    indices = calculateIndex(regionDate, regionLocation);
    path = indices[0] + utcOffset;
    firstIndex = indices[1];
    secondIndex = indices[2];

    var currHour = regionDate.hours();
    var nextHour = currHour + 1;

    if (currHour >= 0 && currHour < 7) {
      phraseOne = TEXTS[hourToIndex(currHour)];
      phraseTwo = TEXTS[hourToIndex(nextHour)];
    } else if (currHour == 7) {
      phraseOne = TEXTS[hourToIndex(currHour)];
      phraseTwo = TEXTS[firstIndex][hourToIndex(nextHour)];
    } else if (currHour >= 8 && currHour < 15) {
      phraseOne = TEXTS[firstIndex][hourToIndex(currHour)];
      phraseTwo = TEXTS[firstIndex][hourToIndex(nextHour)];
    } else if (currHour == 15) {
      phraseOne = TEXTS[firstIndex][hourToIndex(currHour)];
      phraseTwo = TEXTS[firstIndex][secondIndex][hourToIndex(nextHour)];
    } else if (currHour >= 16 && currHour < 24) {
      phraseOne = TEXTS[firstIndex][secondIndex][hourToIndex(currHour)];
      phraseTwo = TEXTS[firstIndex][secondIndex][hourToIndex(nextHour)];
    }
  } else {
    phraseOne = phraseTwo = "INVALID\nDATE.";
  }

  var times = calculateTimes(regionDate);
  var firstAlpha = calculateAlpha(
    times.minutesUntilNextStory,
    times.secondsUntilNextStory
  );
  var secondAlpha = calculateAlpha(
    times.minutesForThisStory,
    times.secondsForThisStory
  );
  var canvas = calculateTexts(phraseOne, firstAlpha, phraseTwo, secondAlpha);

  var data = {
    times: times,
    path: path,
    canvas: canvas.toDataURL()
  };

  res.json(data);
});

// can't be out of MIN/MAX GMT bounds
function checkValidity(regionDate) {
  var gmt = moment().utc();
  var futureGMT = moment(gmt).add(14, "hours");
  var pastGMT = moment(gmt).subtract(12, "hours");
  var validity = true;

  if (!moment(regionDate).isBetween(pastGMT, futureGMT)) {
    validity = false;
  }

  return validity;
}

// returns the index in the stored array
function hourToIndex(hour) {
  return hour % 8;
}

// quite sure all the addition and re-setting can be better arranged
function calculateTimes(date) {
  var time = {};

  var minutesUntilNextStory = 59 - date.minutes();
  var secondsUntilNextStory = 60 - date.seconds();

  if (secondsUntilNextStory == 60) {
    secondsUntilNextStory = 0;
    minutesUntilNextStory += 1;
  }

  var minutesForThisStory = date.minutes();
  var secondsForThisStory = date.seconds();
  if (minutesForThisStory == 0 && secondsForThisStory == 0) {
    minutesUntilNextStory = 60;
  }

  time.minutesUntilNextStory = paddedTime(minutesUntilNextStory);
  time.secondsUntilNextStory = paddedTime(secondsUntilNextStory);
  time.minutesForThisStory = paddedTime(minutesForThisStory);
  time.secondsForThisStory = paddedTime(secondsForThisStory);

  return time;
}

function calculateTexts(phraseOne, phraseOneAlpha, phraseTwo, phraseTwoAlpha) {
  var canvas = createCanvas(640, 80),
    ctx = canvas.getContext("2d");

  ctx.font = "30px Lusitana Bold";

  ctx.fillStyle = "rgba(0, 0, 0, " + phraseOneAlpha + ")";
  if (phraseOne != undefined) ctx.fillText(phraseOne, 10, 25);

  ctx.fillStyle = "rgba(0, 0, 0, " + phraseTwoAlpha + ")";
  if (phraseTwo != undefined) ctx.fillText(phraseTwo, 10, 25);

  return canvas;
}

function paddedTime(time) {
  if (time < 10) {
    return "0" + time;
  } else {
    return time;
  }
}

// grab text paths relative to moon phase and location
function calculateIndex(date, region) {
  // phases go between
  // 0.0 (new moon)
  // 0.25 (first quarter)
  // 0.5 (full moon)
  // 0.75 (last quarter)
  var phase = SunCalc.getMoonIllumination(date).phase;

  // "8 or 9" is the index in the nested arrays to branch to
  if (phase < 0.25) {
    switch (region) {
      case Region.NORTHWEST:
        return ["NW00MA", 8, 8];
      case Region.NORTHEAST:
        return ["NE01MO", 8, 9];
      case Region.SOUTHEAST:
        return ["SW10ME", 9, 8];
      case Region.SOUTHWEST:
        return ["SE11HE", 9, 9];
    }
  } else if (phase >= 0.25 && phase < 0.5) {
    switch (region) {
      case Region.NORTHWEST:
        return ["NW10ME", 9, 8];
      case Region.NORTHEAST:
        return ["NE11HE", 9, 9];
      case Region.SOUTHEAST:
        return ["SW00MA", 8, 8];
      case Region.SOUTHWEST:
        return ["SE01MO", 8, 9];
    }
  } else if (phase >= 0.5 && phase < 0.75) {
    switch (region) {
      case Region.NORTHWEST:
        return ["NW01MO", 8, 9];
      case Region.NORTHEAST:
        return ["NE10ME", 9, 8];
      case Region.SOUTHEAST:
        return ["SW11HE", 9, 9];
      case Region.SOUTHWEST:
        return ["SE00MA", 8, 8];
    }
  } else if (phase >= 0.75) {
    switch (region) {
      case Region.NORTHWEST:
        return ["NW11HE", 9, 9];
      case Region.NORTHEAST:
        return ["NE00MA", 8, 8];
      case Region.SOUTHEAST:
        return ["SW01MO", 8, 9];
      case Region.SOUTHWEST:
        return ["SE10ME", 9, 8];
    }
  }
}

// southern hemisphere is [-90, 0)
// northern hemisphere is [0, 90]
// western hemisphere is [-180, 0)
// eastern hemisphere is [0, 180]
function calculateRegion(latitude, longitude) {
  if (latitude >= 0) {
    return longitude < 0 ? Region.NORTHWEST : Region.NORTHEAST;
  } else {
    return longitude < 0 ? Region.SOUTHWEST : Region.SOUTHEAST;
  }
}

// some range between 0 and 3600 representing the 0 to 1.0 alpha range
function calculateAlpha(m, s) {
  // we may have padded this into a string via `paddedTime` :(
  var minutes = Number(m),
    seconds = Number(s);
  return Number((minutes * 60 + seconds) / 3600).toFixed(2);
}

app.listen(port, () => {
  console.log("App is running on PORT: ", port);
});
