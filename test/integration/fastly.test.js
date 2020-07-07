/* eslint-env mocha */
"use strict";

const request = require("supertest");

const test_cases = require("./normalise-user-agent-test-cases.json");

describe("Fastly -- GET should normalise user-agents correctly", function () {
  this.timeout(30000);

  test_cases.forEach(function ({ input, output }) {
    it(`normalises ${input} into ${output}`, function () {
      return request("http://test.in.ft.com.global.prod.fastly.net")
        .get("/")
        .set("User-Agent", input)
        .expect("Normalized-User-Agent", output.toLowerCase());
    });
  });
});
