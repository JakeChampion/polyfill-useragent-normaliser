"use strict";

const fs = require("fs");
const path = require("path");
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data.json"), "utf8")
);

function convertCaseInsensitivePCREToFlag(regex) {
  if (regex.startsWith("/(?i)")) {
    return regex.replace("(?i)", "") + "i";
  } else {
    return regex;
  }
}
let file = `
"use strict";

const useragent = require("@financial-times/useragent_parser");
const semver = require("semver");

function UA (uaString){
    let normalized;
    if (!uaString) {
        this.ua = {};
        this.ua.family = "other";
        this.ua.major = "0";
        this.ua.minor = "0";
        this.ua.patch = "0";
    } else {
        if (normalized = uaString.match(${convertCaseInsensitivePCREToFlag(
          data.isNormalized
        )})) {
            this.ua = {
                family: normalized[1].toLowerCase(),
                major: normalized[2],
                minor: (normalized[3] || "0"),
                patch: "0"
            };
        } else {
`;
// 1. Add the normalisations
for (const { reason, regex } of data.normalisations) {
  let s = "";
  s += `\n\t\t// ${reason}`;
  s += `\n\t\tuaString = uaString.replace(${convertCaseInsensitivePCREToFlag(
    regex
  )}, "");\n`;
  file += s;
}

// 2. Do the useragent parsing into family/major.minor.patch
file += `
        this.ua = useragent(uaString);
`;

// For improved CDN cache performance, remove the patch version.  There are few cases in which a patch release drops the requirement for a polyfill, but if so, the polyfill can simply be served unnecessarily to the patch versions that contain the fix, and we can stop targeting at the next minor release.
file += `\n\t\tthis.ua.patch = '0';\n`;

// 3. Aliases
file += `\n\t\tthis.ua.family = this.ua.family.toLowerCase();\n}`;
for (const [family, alias] of Object.entries(data.aliases)) {
  if (typeof alias === "string") {
    file += `\n\t\tif (this.ua.family === "${family}") {
            this.ua.family = "${alias}";
		}`;
  } else if (Array.isArray(alias)) {
    file += `\n\t\tif (this.ua.family === "${family}") {
            this.ua.family = "${alias[0]}";
            this.ua.major = "${alias[1]}";
            this.ua.minor = "0";
        }`;
  } else if (typeof alias === "object") {
    file += `\n\t\tif (this.ua.family === "${family}") {`;
    for (const [range, replacement] of Object.entries(alias)) {
      const [major, minor] = range.split(".");
      if (minor !== undefined) {
        file += `\n\t\t\tif (this.ua.family === "${family}" && this.ua.major === "${major}" && this.ua.minor === "${minor}") {`;
      } else {
        file += `\n\t\t\tif (this.ua.family === "${family}" && this.ua.major === "${major}") {`;
      }
      file += `
                this.ua.family = "${replacement[0]}";
                this.ua.major = "${replacement[1]}";
                this.ua.minor = "0";
            }`;
    }
    file += `\n\t\t}`;
  }
}

// 4. Check if browser and version are in the baseline supported browser versions
file += `\n\t\tif (\n            false`;
for (const [family, range] of Object.entries(data.baselineVersions)) {
  if (range === "*") {
    file += ` || \n            (this.ua.family === "${family}")`;
  } else {
    if (Number.isInteger(Number(range))) {
      file += ` || \n            (this.ua.family === "${family}" && Number(this.ua.major) >= ${range})`;
    } else {
      const [major, minor] = range.split(".");
      file += ` || \n            (this.ua.family === "${family}" && Number(this.ua.major + '.' + this.ua.minor) >= ${major}.${minor})`;
    }
  }
}
file += `\n		) {/*empty*/} else {
            this.ua.family = "other";
            this.ua.major = "0";
            this.ua.minor = "0";
            this.ua.patch = "0";
        }`;
file += `
    }
  this.version = (Number(this.ua.major) || 0) + '.' + (Number(this.ua.minor) || 0) + '.0';
}`;

file += `

UA.prototype.getFamily = function() {
	return this.ua.family;
};

UA.prototype.getVersion = function() {
	return this.version;
};

UA.prototype.satisfies = function(range) {
	return semver.satisfies(this.version, range);
}

UA.prototype.getBaseline = function() {
	return UA.getBaselines()[this.ua.family];
};

UA.prototype.meetsBaseline = function() {
	return semver.satisfies(this.version, ">=" + UA.getBaselines()[this.ua.family]);
};

UA.prototype.isUnknown = function() {
	return (Object.keys(UA.getBaselines()).indexOf(this.ua.family) === -1) || !this.meetsBaseline();
};

UA.normalize = function(uaString) {
	const ua = new UA(uaString);
	return ua.getFamily() + '/' + ua.version;
};

UA.getBaselines = function() {
	return ${JSON.stringify(data.baselineVersions, undefined, 4)};
};

module.exports = UA;
`;

fs.writeFileSync(
  path.join(__dirname, "../lib/normalise-user-agent.js"),
  file,
  "utf8"
);
