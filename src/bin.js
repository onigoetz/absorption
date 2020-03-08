#!/usr/bin/env node
const fs = require("fs");
const loudRejection = require("loud-rejection");

const { transformThreshold, loadFile, filePath } = require("./utils.js");
const calculate = require("./index.js");

loudRejection();

process.title = "absorption";

const argv = require("yargs")
  //.usage("Usage: $0 <command> [options]")
  .command(
    ["calculate <repository>", "$0 <repository>"],
    "Count the lines in a file",
    yargs => {
      yargs.positional("repository", {
        describe: "The repository to scan",
        type: "string"
      });
    }
  )
  .option("json", {
    describe: "Output to a JSON file",
    type: "string"
  })
  .option("threshold", {
    describe:
      "start with a number, followed by 'd' for days, 'w' for weeks, 'm' for months or 'y' for years (1y, 6m, 9w)",
    default: "1y",
    type: "string"
  })
  .option("contributors", {
    describe: "Add complementary contributors data, through a JSON file",
    type: "string"
  })
  .option("verbose", {
    type: "boolean",
    default: false
  })
  //.example("$0 calculate -f foo.js", "count the lines in the given file")
  .help("h")
  .alias("h", "help").argv;

const contributors = argv.contributors ? loadFile(argv.contributors) : [];
const threshold = transformThreshold(argv.threshold);
const repository = argv.repository;

function sortByKnowledge(elements) {
  elements.sort((a, b) => {
    if (a.lines < b.lines) {
      return 1;
    } else if (a.lines > b.lines) {
      return -1;
    } else {
      return 0;
    }
  });

  return elements;
}

function printDetail(totalLines, category) {
  category.forEach(({ name, lines }) => {
    const percentage = (lines * 100) / totalLines;
    console.log(` - ${name}  ${percentage.toFixed(2)} %`);
  });
}

function combineActiveAndPassive(active, passive) {
  const combined = {};
  Object.keys(active).forEach(who => {
    if (who === "total") {
      return;
    }
    combined[who] = {
      name: who,
      lines: active[who],
      activeLines: active[who],
      passiveLines: 0
    };
  });

  Object.keys(passive).forEach(who => {
    if (who === "total") {
      return;
    }
    if (!combined.hasOwnProperty(who)) {
      combined[who] = {
        name: who,
        lines: 0,
        activeLines: 0,
        passiveLines: 0
      };
    }
    combined[who].lines += passive[who];
    combined[who].passiveLines = passive[who];
  });

  return combined;
}

calculate(contributors, threshold, repository, argv.verbose).then(result => {
  if (argv.json) {
    const output = filePath(argv.json);
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
    console.log("Report written to", output);
    return;
  }

  const totalLines =
    result.active.total + result.passive.total + result.lost.total;
  const activePercentage = Math.round((result.active.total * 100) / totalLines);
  const passivePercentage = Math.round(
    (result.passive.total * 100) / totalLines
  );
  const lostPercentage = Math.round((result.lost.total * 100) / totalLines);

  console.log("");
  console.log(
    `The repository's absorption score is ${activePercentage}% active, ${passivePercentage}% passive and ${lostPercentage}% lost`
  );
  console.log("");

  const combined = combineActiveAndPassive(result.active, result.passive);

  console.log("Active/Passive members");
  console.log("----------------------");
  const activeMembers = sortByKnowledge(Object.values(combined)).slice(0, 10);
  printDetail(totalLines, activeMembers);

  console.log("Lost");
  console.log("----");
  const lostMapped = Object.entries(result.lost)
    .filter(entry => entry[0] !== "total")
    .map(([name, lines]) => ({ name, lines }));
  const lostMembers = sortByKnowledge(lostMapped).slice(0, 10);
  lostMembers.forEach(({ name, lines }) => {
    const percentage = (lines * 100) / totalLines;
    console.log(` - ${name}  ${percentage.toFixed(2)} %`);
  });
});
