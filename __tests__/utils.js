import { it, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  getDuration,
  loadFile,
  prepareWeights,
  sortByLinesDesc
} from "../src/utils.js";

it("Transform threshold", () => {
  const oneDay = 1000 * 60 * 60 * 24;
  assert.deepEqual(getDuration("4y"), 4 * 365 * oneDay);
  assert.deepEqual(getDuration("12m"), 12 * 30 * oneDay);
  assert.deepEqual(getDuration("16w"), 16 * 7 * oneDay);
  assert.deepEqual(getDuration("42d"), 42 * oneDay);
  assert.throws(() => {
    getDuration("36x");
  }, /Invalid threshold '36x'./);
  assert.throws(() => {
    getDuration("xxx");
  }, /Invalid threshold 'xxx'./);
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

  assert.deepEqual(weight("some/random/file.css"), 1);
  assert.deepEqual(weight("src/business/some/file.js"), 2);
  assert.deepEqual(weight("src/__tests__/utils.js"), 0.5);
  assert.deepEqual(weight("deep/nested/__tests__/utils.js"), 0.5);
  assert.deepEqual(weight("any/javascript.js"), 1.5);
});

it("Weight: Ignore media files", () => {
  const weight = prepareWeights(
    { "**/__tests__/*": 0.5, "**/*.gif": 2 },
    false,
    false
  );

  assert.deepEqual(weight("some/random/file.css"), 1);
  assert.deepEqual(weight("src/business/some/file.js"), 1);
  assert.deepEqual(weight("src/__tests__/utils.js"), 0.5);
  assert.deepEqual(weight("deep/nested/__tests__/utils.js"), 0.5);
  assert.deepEqual(weight("any/file.jpg"), 0);
  assert.deepEqual(weight("any/file.gif"), 2);
  assert.deepEqual(weight("video.mp4"), 0);
});

it("sortByLinesDesc", () => {
  const entry = [{ lines: 22 }, { lines: 340 }, { lines: 340 }, { lines: 4 }];

  assert.deepStrictEqual(sortByLinesDesc(entry), [
    { lines: 340 },
    { lines: 340 },
    { lines: 22 },
    { lines: 4 }
  ]);
});

describe("loadFile()", () => {
  it("should load JSON", async () => {
    assert.deepStrictEqual(await loadFile("./__tests__/fixtures/values.json"), {
      something: 4
    });
  });

  it("Should load CJS", async () => {
    assert.deepStrictEqual(await loadFile("./__tests__/fixtures/values.cjs"), {
      something: 4
    });
  });

  it("Should load MJS", async () => {
    assert.deepStrictEqual(await loadFile("./__tests__/fixtures/values.mjs"), {
      something: 4
    });
  });
});
