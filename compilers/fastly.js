"use strict";

const fs = require("fs");
const path = require("path");
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data.json"), "utf8")
);
const version = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"))
).version.replace(/\./g, "_");
const ua_parser_vcl = fs.readFileSync(
  require.resolve("@financial-times/useragent_parser/lib/ua_parser.vcl"),
  "utf8"
);

// Fastly uses strings as regex and does not want it to start or end with /
function removeRegexLiteralMarkers(regex) {
  return regex.substring(1, regex.length - 1);
}
let file = `${ua_parser_vcl}

sub normalise_user_agent_${version} {
  if (!req.http.User-Agent) {
    set req.http.normalized_user_agent_family = "other";
    set req.http.normalized_user_agent_major_version = "0";
    set req.http.normalized_user_agent_minor_version = "0";
    set req.http.normalized_user_agent_patch_version = "0";
  } else {
    if (req.http.User-Agent ~ {"${removeRegexLiteralMarkers(
      data.isNormalized
    )}"}) {
      set req.http.normalized_user_agent_family = std.tolower(re.group.1);
      set req.http.normalized_user_agent_major_version = re.group.2;
      set req.http.normalized_user_agent_minor_version = if(re.group.3, std.strtol(re.group.3, 10), "0");
      set req.http.normalized_user_agent_patch_version = "0";
    } else {
`;
// 1. Add the normalisations
for (const { reason, regex } of data.normalisations) {
  let s = "";
  s += `\n\t\t# ${reason}`;
  s += `\n\t\tset req.http.User-Agent = regsub(req.http.User-Agent, {"${removeRegexLiteralMarkers(
    regex
  )}"}, "");\n`;
  file += s;
}

// 2. Do the useragent parsing into family/major.minor.patch
file += `
        call useragent_parser;

        # Clone the original values for later modification. This helps when debugging as it let's us see what the useragent_parser function returned.
        set req.http.normalized_user_agent_family = req.http.useragent_parser_family;
        set req.http.normalized_user_agent_major_version = req.http.useragent_parser_major;
        set req.http.normalized_user_agent_minor_version = if(req.http.useragent_parser_minor != "", std.strtol(req.http.useragent_parser_minor, 10), "0");
`;

// For improved CDN cache performance, remove the patch version.  There are few cases in which a patch release drops the requirement for a polyfill, but if so, the polyfill can simply be served unnecessarily to the patch versions that contain the fix, and we can stop targeting at the next minor release.
file += `\n\t\tset req.http.normalized_user_agent_patch_version = "0";\n`;

// 3. Aliases
file += `\n\t\tset req.http.normalized_user_agent_family = std.tolower(req.http.useragent_parser_family);\n\t}`;
for (const [family, alias] of Object.entries(data.aliases)) {
  if (typeof alias === "string") {
    file += `\n\t\tif (req.http.normalized_user_agent_family == "${family}") {
            set req.http.normalized_user_agent_family = "${alias}";
		}`;
  } else if (Array.isArray(alias)) {
    file += `\n\t\tif (req.http.normalized_user_agent_family == "${family}") {
            set req.http.normalized_user_agent_family = "${alias[0]}";
            set req.http.normalized_user_agent_major_version = "${alias[1]}";
            set req.http.normalized_user_agent_minor_version = "0";
        }`;
  } else if (typeof alias === "object") {
    file += `\n\t\tif (req.http.normalized_user_agent_family == "${family}") {`;
    for (const [range, replacement] of Object.entries(alias)) {
      const [major, minor] = range.split(".");
      if (minor !== undefined) {
        file += `\n\t\t\tif (req.http.normalized_user_agent_family == "${family}" && req.http.normalized_user_agent_major_version == "${major}" && req.http.normalized_user_agent_minor_version == "${minor}") {`;
      } else {
        file += `\n\t\t\tif (req.http.normalized_user_agent_family == "${family}" && req.http.normalized_user_agent_major_version == "${major}") {`;
      }
      file += `
                set req.http.normalized_user_agent_family = "${replacement[0]}";
                set req.http.normalized_user_agent_major_version = "${replacement[1]}";
                set req.http.normalized_user_agent_minor_version = "0";
            }`;
    }
    file += `\n\t\t}`;
  }
}

// 4. Check if browser and version are in the baseline supported browser versions
file += `\n\t\tset req.http.normalized_user_agent_temp_version = req.http.normalized_user_agent_major_version req.http.normalized_user_agent_minor_version;`;
file += `\n\t\tif (\n            !req.http.Host`;
for (const [family, range] of Object.entries(data.baselineVersions)) {
  if (range === "*") {
    file += ` || \n            (req.http.normalized_user_agent_family == "${family}")`;
  } else {
    if (Number.isInteger(Number(range))) {
      file += ` || \n            (req.http.normalized_user_agent_family == "${family}" && std.atoi(req.http.normalized_user_agent_major_version) >= ${range})`;
    } else {
      const [major, minor] = range.split(".");
      file += ` || \n            (req.http.normalized_user_agent_family == "${family}" && std.atoi(req.http.normalized_user_agent_temp_version) >= ${
        major + minor
      })`;
    }
  }
}
file += `\n		) {} else {
            set req.http.normalized_user_agent_family = "other";
            set req.http.normalized_user_agent_major_version = "0";
            set req.http.normalized_user_agent_minor_version = "0";
        }`;
file += `\n\t\tunset req.http.normalized_user_agent_temp_version;`;
file += `
    }
    set req.http.Normalized-User-Agent = req.http.normalized_user_agent_family "/"  req.http.normalized_user_agent_major_version "." req.http.normalized_user_agent_minor_version "." req.http.normalized_user_agent_patch_version;
}`;

fs.writeFileSync(
  path.join(__dirname, "../lib/normalise-user-agent.vcl"),
  file,
  "utf8"
);

fs.writeFileSync(
  path.join(__dirname, "../fastly/vcl/main.vcl"),
  `
include "normalise-user-agent.vcl";

sub vcl_recv {
	error 903 "Normalise User Agent";
}

sub vcl_error {
	if (obj.status == 903) {
        call normalise_user_agent_${version};
		set obj.status = 200;
		set obj.response = "OK";
		set obj.http.Content-Type = "text/plain; charset=utf-8";
        set obj.http.normalized_user_agent_family = req.http.normalized_user_agent_family;
        set obj.http.normalized_user_agent_major_version = req.http.normalized_user_agent_major_version;
        set obj.http.normalized_user_agent_minor_version = req.http.normalized_user_agent_minor_version;
        set obj.http.normalized_user_agent_patch_version = req.http.normalized_user_agent_patch_version;
		set obj.http.Normalized-User-Agent = req.http.Normalized-User-Agent;
		synthetic req.http.Normalized-User-Agent;
		return (deliver);
	}
}`,
  "utf8"
);
