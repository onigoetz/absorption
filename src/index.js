const execa = require("execa");

const cacheInstance = require("./cache");

const { chunksToLines } = require("./utils");
const getBlame = require("./blame");
const Queue = require("./queue");

function getFiles(cwd) {
  return execa("git", ["ls-tree", "-r", "master"], { cwd });
}

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

async function computeFiles(cache, repository, verbose) {
  const running = getFiles(repository);

  const queue = new Queue(verbose);
  const data = {};
  for await (const line of chunksToLines(running.stdout)) {
    const separated = line.split(/\t/);
    const filename = separated[1].slice(0, -1);
    const hash = separated[0].slice(-40);
    const cacheKey = `${repository}:${hash}:${filename}:v2`;

    queue.add({
      name: filename,
      fn: async () => {
        const newData = await cache.wrap(cacheKey, () =>
          getBlame(repository, filename)
        );

        appendBlame(data, newData);
      }
    });
  }

  await running;
  await queue.processedAll();

  return data;
}

function computeAbsorption(threshold, contributors, data, verbose) {
  // First we categorize in before / after the threshold
  const before = {};
  const after = {};

  /*const contributorByName = contributors.reduce((acc, curr) => {
    acc[curr.name] = curr;
    return acc;
  }, {});*/

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

  // Then, we categorize in active, passive and lost
  // Active is the amount of lines written in the last year by people still active
  // Passive is the amount of lines written before last year by people still active
  // Lost is the amount of lines written before last year by people inactive
  const active = { total: 0 };
  const passive = { total: 0 };
  const lost = { total: 0 };

  // As-is, the afters are all considered active
  // TODO :: allow to pass more nuanced data on active contributors
  // For example, the user commited in the last year but left the company since
  Object.keys(after).forEach(who => {
    active[who] = after[who];
    active.total += after[who];
  });

  Object.keys(before).forEach(who => {
    const storeInto = active.hasOwnProperty(who) ? passive : lost;
    storeInto[who] = before[who];
    storeInto.total += before[who];
  });

  return { active, passive, lost };
}

module.exports = async function main(
  contributors,
  threshold,
  repository,
  verbose
) {
  const data = await computeFiles(cacheInstance, repository, verbose);
  return computeAbsorption(threshold, contributors, data, verbose);
};
