/* eslint-env mocha */
"use strict";

const UA = require("../../");
const proclaim = require("proclaim");

const test_cases = require("./normalise-user-agent-test-cases.json");

describe("Node -- UA js module", function () {
  test_cases.forEach(function ({ input, output }) {
    it(`normalises ${input} into ${output}`, function () {
      proclaim.deepStrictEqual(UA.normalize(input), output);
    });
  });
});
