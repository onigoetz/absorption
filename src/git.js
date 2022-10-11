import { execa } from "execa";
import { chunksToLines, getBeginningOfMonth } from "./utils.js";

const hashRegex = /^([0-9a-f]{40})\s+(\d+)\s+(\d+)\s+(\d+)/;
const authorRegex = /author(?:-(mail|time|tz))? (.*)/;

export async function getRemoteOrigin(cwd) {
  const result = await execa("git", ["remote", "get-url", "origin"], { cwd });

  return result.stdout;
}

function getFiles(cwd, ref) {
  return execa("git", ["ls-tree", "-r", ref], { cwd });
}

function runBlame(cwd, file, ref) {
  return execa("git", ["blame", "--incremental", file, ref], { cwd });
}

export async function getBlame(cwd, file, ref = "master") {
  const running = runBlame(cwd, file, ref);

  const hashes = {};
  let currentHash;
  for await (const line of chunksToLines(running.stdout)) {
    const m = hashRegex.exec(line);
    if (m) {
      currentHash = m[1];
      const numLines = parseInt(m[4], 10);

      if (!hashes.hasOwnProperty(currentHash)) {
        hashes[currentHash] = {
          numLines: 0,
          author: "",
          mail: "",
          time: "",
          tz: ""
        };
      }

      hashes[currentHash].numLines += numLines;
    } else {
      const author = authorRegex.exec(line);
      if (author) {
        hashes[currentHash][author[1] || "author"] = author[2];
      }

      // We don't care about the other lines
    }
  }

  const mapped = Object.values(hashes).reduce((acc, current) => {
    const date = getBeginningOfMonth(current.time * 1000);
    const dateKey = `${date.getTime()}`;
    if (!acc.hasOwnProperty(dateKey)) {
      acc[dateKey] = {};
    }

    const authorKey = `${current.author} ${current.mail}`;
    if (!acc[dateKey].hasOwnProperty(authorKey)) {
      acc[dateKey][authorKey] = 0;
    }

    acc[dateKey][authorKey] += current.numLines;

    return acc;
  }, {});

  await running;

  return mapped;
}

export async function listFiles(repository, onFile, ref = "master") {
  const running = getFiles(repository, ref);

  for await (const line of chunksToLines(running.stdout)) {
    const separated = line.split(/\t/);
    const type = line.slice(7, 11);

    if (type === "blob") {
      const filename = separated[1].slice(0, -1);
      const hash = separated[0].slice(-40);
      onFile(filename, hash);
    }
  }

  await running;
}
