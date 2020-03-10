#!/usr/bin/env node
const fs = require("fs");
const yargs = require("yargs");
const loudRejection = require("loud-rejection");
const { bold } = require("kleur");
const table = require("tty-table");

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

function renderFresh(result) {
  function toPct(lines) {
    return `${((lines * 100) / result.total).toFixed(2)} %`;
  }

  const header = [
    {
      value: "name",
      alias: "Name",
      align: "left",
      headerAlign: "left"
    },
    {
      value: "lines",
      alias: "Total",
      align: "right",
      width: 10,
      formatter: toPct
    },
    {
      value: "freshLines",
      alias: "Fresh",
      align: "right",
      width: 10,
      formatter: toPct
    },
    {
      value: "fadingLines",
      alias: "Fading",
      align: "right",
      width: 10,
      formatter: toPct
    }
  ];

  const options = {
    borderStyle: "solid",
    borderColor: "gray",
    headerAlign: "right"
  };

  console.log(
    table(header, result.knowledge.fresh.slice(0, 10), null, options).render()
  );
}

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
        `The repository's absorption score is ${result.absorption.fresh}% fresh, ${result.absorption.fading}% fading and ${result.absorption.lost}% lost`
      );
      console.log("");

      console.log(bold("Fresh/Fading knowledge"));

      if (result.knowledge.fresh.length) {
        renderFresh(result);
      } else {
        console.log("It seems this repository has no fresh knowledge.");
      }

      console.log();
      console.log(bold("Lost"));

      if (result.knowledge.lost.length) {
        result.knowledge.lost.slice(0, 10).forEach(({ name, lines }) => {
          const percentage = (lines * 100) / result.total;
          console.log(` - ${name}  ${percentage.toFixed(2)} %`);
        });
      } else {
        console.log(
          "It seems this repository has no lost knowledge, congratulations !"
        );
      }
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
