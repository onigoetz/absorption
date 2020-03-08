const path = require("path");
const mm = require("micromatch");

/**
 * @param chunkIterable An asynchronous or synchronous iterable
 * over “chunks” (arbitrary strings)
 * @returns An asynchronous iterable over “lines”
 * (strings with at most one newline that always appears at the end)
 */
async function* chunksToLines(chunkIterable) {
  let previous = "";
  for await (const chunk of chunkIterable) {
    previous += chunk;
    while (true) {
      const eolIndex = previous.indexOf("\n");
      if (eolIndex < 0) {
        break;
      }

      // line includes the EOL
      const line = previous.slice(0, eolIndex + 1);
      yield line;
      previous = previous.slice(eolIndex + 1);
    }
  }
  if (previous.length > 0) {
    yield previous;
  }
}

function getBeginningOfMonth(time) {
  const rawDate = new Date(time);
  const year = rawDate.getFullYear();
  const month = rawDate.getMonth();
  return new Date(year, month, 1, 0, 0, 0, 0);
}

const thresholdRegex = /^([0-9]+)([ymwd]{1})$/;
const oneDay = 1000 * 60 * 60 * 24;
const thresholdMultipliers = {
  d: 1,
  m: 30,
  w: 7,
  y: 365
};

function getDuration(threshold) {
  const m = thresholdRegex.exec(threshold);

  if (!m) {
    throw new Error(
      `Invalid threshold '${threshold}'. Valid values start with a number, followed by 'd' for days, 'w' for weeks, 'm' for months or 'y' for years`
    );
  }

  return oneDay * parseInt(m[1], 10) * thresholdMultipliers[m[2]];
}

function transformThreshold(threshold) {
  const now = new Date().getTime();
  return now - getDuration(threshold);
}

function filePath(file) {
  return path.isAbsolute(file) ? file : path.join(process.cwd(), file);
}

function loadFile(file) {
  return require(filePath(file));
}

function prepareWeights(weights) {
  const methods = Object.entries(weights).map(([glob, weight]) => [
    mm.matcher(glob),
    weight
  ]);

  // Add a default method with a weight of 1
  methods.push([() => true, 1]);

  return file => methods.find(([fn]) => fn(file))[1];
}

module.exports = {
  chunksToLines,
  getBeginningOfMonth,
  getDuration,
  transformThreshold,
  filePath,
  loadFile,
  prepareWeights
};
