const cacheInstance = require("./cache");
const { getBlame, listFiles, getRemoteOrigin } = require("./git");
const { sortByLinesDesc } = require("./utils");
const Queue = require("./queue");

function appendBlame(data, moreData) {
  Object.keys(moreData).forEach(dateKey => {
    if (!data.hasOwnProperty(dateKey)) {
      data[dateKey] = moreData[dateKey];
      return;
    }

    Object.keys(moreData[dateKey]).forEach(authorKey => {
      if (!data[dateKey].hasOwnProperty(authorKey)) {
        data[dateKey][authorKey] = moreData[dateKey][authorKey];
        return;
      }

      data[dateKey][authorKey] += moreData[dateKey][authorKey];
    });
  });
}

function getLevelBefore(contributorByName, fresh, who) {
  // Find if there was an override
  if (
    contributorByName.hasOwnProperty(who) &&
    contributorByName[who].hasOwnProperty("active")
  ) {
    return contributorByName[who].active ? "fading" : "lost";
  }

  return fresh.hasOwnProperty(who) ? "fading" : "lost";
}

function getLevelAfter(contributorByName, who) {
  // Find if there was an override
  if (
    contributorByName.hasOwnProperty(who) &&
    contributorByName[who].hasOwnProperty("active")
  ) {
    return contributorByName[who].active ? "fresh" : "lost";
  }

  return "fresh";
}

function computeAbsorption(threshold, contributors, data, verbose) {
  // First we categorize in before / after the threshold
  const before = {};
  const after = {};

  const contributorByName = contributors.reduce((acc, curr) => {
    acc[curr.name] = curr;
    return acc;
  }, {});

  Object.keys(data).forEach(key => {
    const storeInto = parseInt(key, 10) < threshold ? before : after;

    Object.keys(data[key]).forEach(who => {
      let name = who;
      const contributor = contributors.find(
        c => c.identities.indexOf(who) > -1
      );
      if (contributor) {
        // Ignore bots from data
        if (contributor.type === "bot") {
          return;
        }
        name = contributor.name;
      }

      if (!storeInto.hasOwnProperty(name)) {
        storeInto[name] = 0;
      }

      storeInto[name] += data[key][who];
    });
  });

  // Then, we categorize in fresh, fading and lost
  // Fresh is the amount of lines written in the threshold period by people still active
  // Fading is the amount of lines written before the threshold period by people still active
  // Lost is the amount of lines written before the threshold period by people inactive
  const levels = {
    fresh: { total: 0 },
    fading: { total: 0 },
    lost: { total: 0 }
  };

  // Code that was contributed more recently than the threshold is considered active
  // Except if the contributor has been explicitly set as "active: false"
  // In that case, it's considered lost
  Object.keys(after).forEach(who => {
    const level = getLevelAfter(contributorByName, who);
    levels[level][who] = after[who];
    levels[level].total += after[who];
  });

  // Code that was contributed before the thresold is considered lost
  // If it was contributed by an active contributor, it is considered fading
  // If it was contributed by a contributor explicitly set as "active: true"
  // it will be set as fading even if the contributor didn't contribute more recently.
  Object.keys(before).forEach(who => {
    const level = getLevelBefore(contributorByName, levels.fresh, who);
    if (!levels[level].hasOwnProperty(who)) {
      levels[level][who] = 0;
    }
    levels[level][who] += before[who];
    levels[level].total += before[who];
  });

  return levels;
}

function toPercentage(current, total) {
  return (current * 100) / total;
}

function combineFreshAndFading(fresh, fading) {
  const combined = {};
  Object.keys(fresh).forEach(who => {
    if (who === "total") {
      return;
    }
    combined[who] = {
      name: who,
      lines: fresh[who],
      freshLines: fresh[who],
      fadingLines: 0
    };
  });

  Object.keys(fading).forEach(who => {
    if (who === "total") {
      return;
    }
    if (!combined.hasOwnProperty(who)) {
      combined[who] = {
        name: who,
        lines: 0,
        freshLines: 0,
        fadingLines: 0
      };
    }
    combined[who].lines += fading[who];
    combined[who].fadingLines = fading[who];
  });

  return combined;
}

function rebalance(newData, weight) {
  const final = {};
  Object.keys(newData).forEach(timestamp => {
    final[timestamp] = {};

    Object.keys(newData[timestamp]).forEach(who => {
      final[timestamp][who] = newData[timestamp][who] * weight;
    });
  });

  return final;
}

module.exports = async function main(
  contributors,
  getWeight,
  threshold,
  repository,
  verbose,
  maxContributors,
  maxLostContributors
) {
  const queue = new Queue(verbose);
  const data = {};
  const fileData = {};

  let repositoryCacheKey = repository;
  try {
    // Get the origin url as cache key, allows for better caching, instead of relying on absolute or relative paths
    repositoryCacheKey = await getRemoteOrigin(repository);
  } catch (e) {
    if (verbose) {
      // It's not that important if this fails, we can ignore it, unless we're in verbose mode
      console.error(e.message || e.shortMessage || e.stderr);
    }
  }

  await listFiles(repository, (filename, hash) => {
    const weight = getWeight(filename);

    if (weight === 0) {
      if (verbose) {
        console.log("Ignoring file", filename);
      }

      return;
    }

    const cacheKey = `${repositoryCacheKey}:${hash}:${filename}:v2`;
    queue.add({
      name: filename,
      fn: async () => {
        const newData = await cacheInstance.wrap(cacheKey, () =>
          getBlame(repository, filename)
        );

        fileData[filename] = newData;

        const balanced = rebalance(newData, weight);

        appendBlame(data, balanced);
      }
    });
  });

  await queue.await();

  const { fresh, fading, lost } = computeAbsorption(
    threshold,
    contributors,
    data,
    verbose
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
      lost
    },
    absorption: {
      fresh: freshPercentage,
      fading: fadingPercentage,
      lost: lostPercentage
    },
    knowledge: {
      fresh: sortByLinesDesc(freshKnowledge),
      lost: sortByLinesDesc(
        Object.entries(lost)
          .filter(entry => entry[0] !== "total")
          .map(([name, lines]) => ({ name, lines }))
      )
    },
    fileData
  };
};
