#!/usr/bin/env node
const fs = require("fs");
const yargs = require("yargs");
const loudRejection = require("loud-rejection");

const {
  transformThreshold,
  loadFile,
  filePath,
  prepareWeights
} = require("./utils.js");
const { listFiles } = require("./git.js");
const calculate = require("./index.js");

loudRejection();

process.title = "absorption";

yargs
  //.usage("Usage: $0 <command> [options]")
  .command(
    "list-files <repository>",
    "List all files and their weights",
    config => {
      config.positional("repository", {
        describe: "The repository to scan",
        type: "string"
      });
    },
    async argv => {
      const repository = argv.repository;
      const weights = argv.weights ? loadFile(argv.weights) : {};
      const withMedia = argv.withMedia;

      const getWeight = prepareWeights(weights, withMedia);

      await listFiles(repository, (filename, hash) => {
        console.log(` ${filename} ${getWeight(filename)}`);
      });
    }
  )
  .command(
    ["calculate <repository>", "$0 <repository>"],
    "Calculate absorption",
    config => {
      config.positional("repository", {
        describe: "The repository to scan",
        type: "string"
      });
    },
    async argv => {
      const contributors = argv.contributors ? loadFile(argv.contributors) : [];
      const repository = argv.repository;
      const threshold = transformThreshold(argv.threshold);
      const weights = argv.weights ? loadFile(argv.weights) : {};
      const withMedia = argv.withMedia;

      const result = await calculate(
        contributors,
        prepareWeights(weights, withMedia),
        threshold,
        repository,
        argv.verbose
      );

      if (argv.json) {
        const output = filePath(argv.json);
        fs.writeFileSync(output, JSON.stringify(result, null, 2));
        console.log("Report written to", output);
        return;
      }

      console.log("");
      console.log(
        `The repository's absorption score is ${result.absorption.active}% active, ${result.absorption.passive}% passive and ${result.absorption.lost}% lost`
      );
      console.log("");

      console.log("Active/Passive members");
      console.log("----------------------");
      const activeMembers = result.knowledge.active.slice(0, 10);
      activeMembers.forEach(({ name, lines, activeLines, passiveLines }) => {
        const percentage = (lines * 100) / result.total;
        const active = (activeLines * 100) / result.total;
        const passive = (passiveLines * 100) / result.total;
        console.log(
          ` - ${name}  ${percentage.toFixed(2)} % (${active.toFixed(
            2
          )}% active, ${passive.toFixed(2)}% passive)`
        );
      });

      console.log("Lost");
      console.log("----");
      const lostMembers = result.knowledge.lost.slice(0, 10);
      lostMembers.forEach(({ name, lines }) => {
        const percentage = (lines * 100) / result.total;
        console.log(` - ${name}  ${percentage.toFixed(2)} %`);
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
  .option("weights", {
    describe: "Change the weight of each file, through a JSON file",
    type: "string"
  })
  .option("with-media", {
    describe: "Media files are ignored by default, this restores them",
    type: "boolean",
    default: false
  })
  .option("verbose", {
    type: "boolean",
    default: false
  })
  //.example("$0 calculate -f foo.js", "count the lines in the given file")
  .help("h")
  .alias("h", "help").argv;
