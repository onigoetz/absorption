#!/usr/bin/env node
import fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import hardRejection from "hard-rejection";
import colors from "colors/safe.js";
import { table } from "table";

import {
  transformThreshold,
  loadFile,
  filePath,
  prepareWeights,
  sortByLinesDesc
} from "./utils.js";
import { listFiles } from "./git.js";
import calculate from "./index.js";

hardRejection();

process.title = "absorption";

function renderTable(header, columns, rows) {
  const options = {
    border: {
      bodyLeft: ``,
      bodyRight: ``,
      bodyJoin: colors.gray(`│`),
      joinBody: colors.gray(`─`),
      joinLeft: ``,
      joinRight: ``,
      joinJoin: colors.gray(`┼`)
    },
    drawHorizontalLine(index) {
      return index === 1;
    },
    columns
  };

  return table([header].concat(rows), options);
}

function renderFresh(result, maxResults) {
  function toPct(lines) {
    return `${((lines * 100) / result.total).toFixed(2)} %`;
  }

  const rows = result.knowledge.fresh
    .slice(0, maxResults)
    .map(({ name, lines, freshLines, fadingLines }) => [
      name,
      toPct(lines),
      toPct(freshLines),
      toPct(fadingLines)
    ]);

  const columns = {
    0: {
      alignment: "left"
    },
    1: {
      alignment: "right",
      width: 8
    },
    2: {
      alignment: "right",
      width: 8
    },
    3: {
      alignment: "right",
      width: 8
    }
  };

  console.log(renderTable(["Name", "Total", "Fresh", "Fading"], columns, rows));
}

function renderLost(result, maxLostContributors) {
  function toPct(lines) {
    return `${((lines * 100) / result.total).toFixed(2)} %`;
  }

  const rows = result.knowledge.lost
    .slice(0, maxLostContributors)
    .map(({ name, lines }) => [name, toPct(lines)]);

  const columns = {
    0: {
      alignment: "left"
    },
    1: {
      alignment: "right",
      width: 8
    }
  };

  console.log(renderTable(["Name", "Total"], columns, rows));
}

function renderBigFiles(fileData) {
  const rows = sortByLinesDesc(
    Object.entries(fileData).reduce((acc, [name, data]) => {
      const lines = Object.values(data).reduce(
        (total, fileContributors) =>
          total +
          Object.values(fileContributors).reduce(
            (subTotal, contributor) => subTotal + contributor,
            0
          ),
        0
      );

      acc.push({ name, lines });

      return acc;
    }, [])
  )
    .slice(0, 5)
    .map(({ name, lines }) => [name, lines]);

  const columns = {
    0: {
      alignment: "left"
    },
    1: {
      alignment: "right"
    }
  };

  console.log(renderTable(["File", "Lines"], columns, rows));
}

function renderTitle(title) {
  console.log();
  console.log(colors.bold(title));
  console.log();
}

function commandRepositoryConfig(config) {
  config.positional("repository", {
    describe: "The repository to scan",
    type: "string"
  });
}

yargs(hideBin(process.argv))
  //.usage("Usage: $0 <command> [options]")
  .command(
    "list-files <repository>",
    "List all files and their weights",
    commandRepositoryConfig,
    async argv => {
      const repository = argv.repository;
      const weights = argv.weights ? await loadFile(argv.weights) : {};
      const withMedia = argv.withMedia;
      const withLockfiles = argv.withLockfiles;

      const getWeight = prepareWeights(weights, withMedia, withLockfiles);

      await listFiles(repository, (filename, hash) => {
        console.log(` ${filename} ${getWeight(filename)}`);
      });
    }
  )
  .command(
    ["calculate <repository>", "$0 <repository>"],
    "Calculate absorption",
    commandRepositoryConfig,
    async argv => {
      const contributors = argv.contributors
        ? await loadFile(argv.contributors)
        : [];
      const repository = argv.repository;
      const threshold = transformThreshold(argv.threshold);
      const weights = argv.weights ? await loadFile(argv.weights) : {};
      const withMedia = argv.withMedia;
      const withLockfiles = argv.withLockfiles;
      const verbose = argv.verbose;
      const maxContributors = argv.maxContributors;
      const maxLostContributors = argv.maxLostContributors;

      const result = await calculate(
        contributors,
        prepareWeights(weights, withMedia, withLockfiles),
        threshold,
        repository,
        verbose,
        maxContributors,
        maxLostContributors
      );

      if (argv.json) {
        if (!verbose) {
          delete result.fileData;
        }

        const output = filePath(argv.json);
        fs.writeFileSync(output, JSON.stringify(result, null, 2));
        console.log("Report written to", output);
        return;
      }

      console.log();
      console.log(
        `The repository's absorption score is ${result.absorption.fresh}% fresh, ${result.absorption.fading}% fading and ${result.absorption.lost}% lost`
      );

      renderTitle("Fresh/Fading knowledge");
      if (result.knowledge.fresh.length) {
        renderFresh(result, argv.maxContributors);
      } else {
        console.log("It seems this repository has no fresh knowledge.");
      }

      renderTitle("Lost knowledge");
      if (result.knowledge.lost.length) {
        renderLost(result, argv.maxLostContributors);
      } else {
        console.log(
          "It seems this repository has no lost knowledge, congratulations !"
        );
      }

      renderTitle("Biggest files");
      console.log(
        "Big files can skew the results (static test data, media files...), here are the biggest files found in this repository."
      );
      console.log();

      renderBigFiles(result.fileData);
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
  .option("max-contributors", {
    describe: "Max number of active contributors",
    type: "integer",
    default: 10
  })
  .option("max-lost-contributors", {
    describe: "Max number of lost contributors",
    type: "integer",
    default: 10
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
  .alias("h", "help")
  .parse();
