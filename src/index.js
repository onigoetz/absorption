import { cpus } from "node:os";
import cliProgress from "cli-progress";
import { execa } from "execa";
import Queue from "p-queue";
import cacheInstance from "./cache.js";
import { getBlame, getRemoteOrigin, listFiles } from "./git.js";
import { sortByLinesDesc } from "./utils.js";

// We want to parallelize as much as possible,
// but we certainly don't want to kill the machine it's running on.
// This process will run 5 elements in parallel or cpu cores/2, whichever comes first
const maxProcess = Math.min(5, Math.max(1, Math.floor(cpus().length / 2)));

function appendBlame(data, moreData) {
  for (const dateKey of Object.keys(moreData)) {
    if (!Object.hasOwn(data, dateKey)) {
      data[dateKey] = moreData[dateKey];
      return;
    }

    for (const authorKey of Object.keys(moreData[dateKey])) {
      if (!Object.hasOwn(data[dateKey], authorKey)) {
        data[dateKey][authorKey] = moreData[dateKey][authorKey];
        continue;
      }

      data[dateKey][authorKey] += moreData[dateKey][authorKey];
    }
  }
}

function getLevelBefore(contributorByName, fresh, who) {
  // Find if there was an override
  if (
    Object.hasOwn(contributorByName, who) &&
    Object.hasOwn(contributorByName[who], "active")
  ) {
    return contributorByName[who].active ? "fading" : "lost";
  }

  return Object.hasOwn(fresh, who) ? "fading" : "lost";
}

function getLevelAfter(contributorByName, who) {
  // Find if there was an override
  if (
    Object.hasOwn(contributorByName, who) &&
    Object.hasOwn(contributorByName[who], "active")
  ) {
    return contributorByName[who].active ? "fresh" : "lost";
  }

  return "fresh";
}

function computeAbsorption(threshold, contributors, data) {
  // First we categorize in before / after the threshold
  const before = {};
  const after = {};

  const contributorByName = contributors.reduce((acc, curr) => {
    acc[curr.name] = curr;
    return acc;
  }, {});

  for (const key of Object.keys(data)) {
    const storeInto = Number.parseInt(key, 10) < threshold ? before : after;

    for (const who of Object.keys(data[key])) {
      let name = who;
      const contributor = contributors.find(
        (c) => c.identities.indexOf(who) > -1,
      );
      if (contributor) {
        // Ignore bots from data
        if (contributor.type === "bot") {
          continue;
        }
        name = contributor.name;
      }

      if (!Object.hasOwn(storeInto, name)) {
        storeInto[name] = 0;
      }

      storeInto[name] += data[key][who];
    }
  }

  // Then, we categorize in fresh, fading and lost
  // Fresh is the amount of lines written in the threshold period by people still active
  // Fading is the amount of lines written before the threshold period by people still active
  // Lost is the amount of lines written before the threshold period by people inactive
  const levels = {
    fresh: { total: 0 },
    fading: { total: 0 },
    lost: { total: 0 },
  };

  // Code that was contributed more recently than the threshold is considered active
  // Except if the contributor has been explicitly set as "active: false"
  // In that case, it's considered lost
  for (const who of Object.keys(after)) {
    const level = getLevelAfter(contributorByName, who);
    levels[level][who] = after[who];
    levels[level].total += after[who];
  }

  // Code that was contributed before the thresold is considered lost
  // If it was contributed by an active contributor, it is considered fading
  // If it was contributed by a contributor explicitly set as "active: true"
  // it will be set as fading even if the contributor didn't contribute more recently.
  for (const who of Object.keys(before)) {
    const level = getLevelBefore(contributorByName, levels.fresh, who);
    if (!Object.hasOwn(levels[level], who)) {
      levels[level][who] = 0;
    }
    levels[level][who] += before[who];
    levels[level].total += before[who];
  }

  return levels;
}

function toPercentage(current, total) {
  return (current * 100) / total;
}

function combineFreshAndFading(fresh, fading) {
  const combined = {};
  for (const who of Object.keys(fresh)) {
    if (who === "total") {
      continue;
    }
    combined[who] = {
      name: who,
      lines: fresh[who],
      freshLines: fresh[who],
      fadingLines: 0,
    };
  }

  for (const who of Object.keys(fading)) {
    if (who === "total") {
      continue;
    }
    if (!Object.hasOwn(combined, who)) {
      combined[who] = {
        name: who,
        lines: 0,
        freshLines: 0,
        fadingLines: 0,
      };
    }
    combined[who].lines += fading[who];
    combined[who].fadingLines = fading[who];
  }

  return combined;
}

function rebalance(newData, weight) {
  const final = {};
  for (const timestamp of Object.keys(newData)) {
    final[timestamp] = {};

    for (const who of Object.keys(newData[timestamp])) {
      final[timestamp][who] = newData[timestamp][who] * weight;
    }
  }

  return final;
}

export default async function main(
  contributors,
  getWeight,
  threshold,
  repository,
  verbose,
  branch,
) {
  let queueMaxSize = 0;
  const queue = new Queue({ concurrency: maxProcess });
  let progress = {
    stop() {
      // Fake progress
    },
  };
  if (!verbose) {
    progress = new cliProgress.SingleBar({
      format: "Scanning {bar} | {percentage}% | {value}/{total} files",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
    });

    queue.on("add", () => {
      if (queueMaxSize === 0) {
        progress.start(1, 0);
      }

      queueMaxSize++;
      progress.setTotal(queueMaxSize);
    });
    queue.on("next", () => {
      progress.increment();
    });
  }

  const data = {};
  const fileData = {};

  let repositoryCacheKey = repository;
  try {
    // Get the origin url as cache key, allows for better caching, instead of relying on absolute or relative paths
    repositoryCacheKey = await getRemoteOrigin(execa, repository);
  } catch (e) {
    if (verbose) {
      // It's not that important if this fails, we can ignore it, unless we're in verbose mode
      console.error(e.message || e.shortMessage || e.stderr);
    }
  }

  await listFiles(
    execa,
    repository,
    (filename, hash) => {
      const weight = getWeight(filename);

      if (weight === 0) {
        if (verbose) {
          console.log("Ignoring file", filename);
        }

        return;
      }

      const cacheKey = `${repositoryCacheKey}:${hash}:${filename}:v2`;
      queue.add(async () => {
        const newData = await cacheInstance.wrap(cacheKey, () =>
          getBlame(execa, repository, filename, branch),
        );

        fileData[filename] = newData;

        const balanced = rebalance(newData, weight);

        appendBlame(data, balanced);
      });
    },
    branch,
  );

  await queue.onIdle();
  progress.stop();

  const { fresh, fading, lost } = computeAbsorption(
    threshold,
    contributors,
    data,
  );

  const totalLines = fresh.total + fading.total + lost.total;
  const freshPercentage = Math.round(toPercentage(fresh.total, totalLines));
  const fadingPercentage = Math.round(toPercentage(fading.total, totalLines));
  const lostPercentage = Math.round(toPercentage(lost.total, totalLines));

  const combined = combineFreshAndFading(fresh, fading);

  const freshKnowledge = sortByLinesDesc(Object.values(combined));

  return {
    total: totalLines,
    categories: {
      fresh,
      fading,
      lost,
    },
    absorption: {
      fresh: freshPercentage,
      fading: fadingPercentage,
      lost: lostPercentage,
    },
    knowledge: {
      fresh: sortByLinesDesc(freshKnowledge),
      lost: sortByLinesDesc(
        Object.entries(lost)
          .filter((entry) => entry[0] !== "total")
          .map(([name, lines]) => ({ name, lines })),
      ),
    },
    fileData,
  };
}
