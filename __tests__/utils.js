import { it, describe, expect } from '@rstest/core';

import {
  getDuration,
  loadFile,
  prepareWeights,
  sortByLinesDesc
} from "../src/utils.js";

it("Transform threshold", () => {
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

it("Weight", () => {
  const weight = prepareWeights(
    {
      "**/__tests__/*": 0.5,
      "src/business/**": 2,
      "**/*.js": 1.5
    },
    true,
    false
  );

  expect(weight("some/random/file.css")).toEqual(1);
  expect(weight("src/business/some/file.js")).toEqual(2);
  expect(weight("src/__tests__/utils.js")).toEqual(0.5);
  expect(weight("deep/nested/__tests__/utils.js")).toEqual(0.5);
  expect(weight("any/javascript.js")).toEqual(1.5);
});

it("Weight: Ignore media files", () => {
  const weight = prepareWeights(
    { "**/__tests__/*": 0.5, "**/*.gif": 2 },
    false,
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

it("sortByLinesDesc", () => {
  const entry = [{ lines: 22 }, { lines: 340 }, { lines: 340 }, { lines: 4 }];

  expect(sortByLinesDesc(entry)).toStrictEqual([
    { lines: 340 },
    { lines: 340 },
    { lines: 22 },
    { lines: 4 }
  ]);
});

describe("loadFile()", () => {
  it("should load JSON", async () => {
    expect(await loadFile("./__tests__/fixtures/values.json")).toStrictEqual({
      something: 4
    });
  });

  it("Should load CJS", async () => {
    expect(await loadFile("./__tests__/fixtures/values.cjs")).toStrictEqual({
      something: 4
    });
  });

  it("Should load MJS", async () => {
    expect(await loadFile("./__tests__/fixtures/values.mjs")).toStrictEqual({
      something: 4
    });
  });
});
