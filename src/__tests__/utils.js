import test from "ava";

import { getDuration, prepareWeights } from "../utils.js";

test("Transform threshold", t => {
  const oneDay = 1000 * 60 * 60 * 24;
  t.is(getDuration("4y"), 4 * 365 * oneDay);
  t.is(getDuration("12m"), 12 * 30 * oneDay);
  t.is(getDuration("16w"), 16 * 7 * oneDay);
  t.is(getDuration("42d"), 42 * oneDay);
  t.throws(
    () => {
      getDuration("36x");
    },
    { message: /Invalid threshold '36x'./ }
  );
  t.throws(
    () => {
      getDuration("xxx");
    },
    { message: /Invalid threshold 'xxx'./ }
  );
});

test("Weight", t => {
  const weight = prepareWeights(
    {
      "**/__tests__/*": 0.5,
      "src/business/**": 2,
      "**/*.js": 1.5
    },
    true,
    false
  );

  t.is(1, weight("some/random/file.css"));
  t.is(2, weight("src/business/some/file.js"));
  t.is(0.5, weight("src/__tests__/utils.js"));
  t.is(0.5, weight("deep/nested/__tests__/utils.js"));
  t.is(1.5, weight("any/javascript.js"));
});

test("Weight: Ignore media files", t => {
  const weight = prepareWeights(
    { "**/__tests__/*": 0.5, "**/*.gif": 2 },
    false,
    false
  );

  t.is(weight("some/random/file.css"), 1);
  t.is(weight("src/business/some/file.js"), 1);
  t.is(weight("src/__tests__/utils.js"), 0.5);
  t.is(weight("deep/nested/__tests__/utils.js"), 0.5);
  t.is(weight("any/file.jpg"), 0);
  t.is(weight("any/file.gif"), 2);
  t.is(weight("video.mp4"), 0);
});
