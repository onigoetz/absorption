/* global test, expect */
const { getDuration, prepareWeights } = require("../utils.js");

test("Transform threshold", () => {
  const oneDay = 1000 * 60 * 60 * 24;
  expect(getDuration("4y")).toEqual(4 * 365 * oneDay);
  expect(getDuration("12m")).toEqual(12 * 30 * oneDay);
  expect(getDuration("16w")).toEqual(16 * 7 * oneDay);
  expect(getDuration("42d")).toEqual(42 * oneDay);
  expect(() => {
    getDuration("36x");
  }).toThrow(/Invalid threshold '36x'./);
  expect(() => {
    getDuration("xxx");
  }).toThrow(/Invalid threshold 'xxx'./);
});

test("Weight", () => {
  const weight = prepareWeights(
    {
      "**/__tests__/*": 0.5,
      "src/business/**": 2,
      "**/*.js": 1.5
    },
    true
  );

  expect(weight("some/random/file.css")).toEqual(1);
  expect(weight("src/business/some/file.js")).toEqual(2);
  expect(weight("src/__tests__/utils.js")).toEqual(0.5);
  expect(weight("deep/nested/__tests__/utils.js")).toEqual(0.5);
  expect(weight("any/javascript.js")).toEqual(1.5);
});

test("Weight: Ignore media files", () => {
  const weight = prepareWeights(
    { "**/__tests__/*": 0.5, "**/*.gif": 2 },
    false
  );

  expect(weight("some/random/file.css")).toEqual(1);
  expect(weight("src/business/some/file.js")).toEqual(1);
  expect(weight("src/__tests__/utils.js")).toEqual(0.5);
  expect(weight("deep/nested/__tests__/utils.js")).toEqual(0.5);
  expect(weight("any/file.jpg")).toEqual(0);
  expect(weight("any/file.gif")).toEqual(2);
  expect(weight("video.mp4")).toEqual(0);
});
