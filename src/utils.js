import fs from "node:fs";
import path from "node:path";
import mm from "micromatch";

/**
 * @param chunkIterable An asynchronous or synchronous iterable
 * over “chunks” (arbitrary strings)
 * @returns An asynchronous iterable over “lines”
 * (strings with at most one newline that always appears at the end)
 */
export async function* chunksToLines(chunkIterable) {
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

export function getBeginningOfMonth(time) {
  const rawDate = new Date(time);
  const year = rawDate.getFullYear();
  const month = rawDate.getMonth();
  return new Date(year, month, 1, 0, 0, 0, 0);
}

const thresholdRegex = /^(\d+)([ymwd]{1})$/;
const oneDay = 1000 * 60 * 60 * 24;
const thresholdMultipliers = {
  d: 1,
  m: 30,
  w: 7,
  y: 365,
};

export function getDuration(threshold) {
  const m = thresholdRegex.exec(threshold);

  if (!m) {
    throw new Error(
      `Invalid threshold '${threshold}'. Valid values start with a number, followed by 'd' for days, 'w' for weeks, 'm' for months or 'y' for years`,
    );
  }

  return oneDay * Number.parseInt(m[1], 10) * thresholdMultipliers[m[2]];
}

export function transformThreshold(threshold) {
  return Date.now() - getDuration(threshold);
}

export function filePath(file) {
  return path.isAbsolute(file) ? file : path.join(process.cwd(), file);
}

export async function loadFile(file) {
  const resolvedPath = filePath(file);

  // JSON Files have to be parsed by loading them
  if (/\.json$/.test(file)) {
    return fs.promises
      .readFile(resolvedPath, { encoding: "UTF-8" })
      .then((content) => JSON.parse(content));
  }

  const imported = await import(resolvedPath);

  if (imported.default) {
    return imported.default;
  }

  return imported;
}

const mediaPatterns = [
  // Images
  "**/*.{jpg,jpeg,tiff,gif,bmp,png,webp,heif,ico}",
  // Audio
  "**/*.{3gp,aa,aac,aax,act,aiff,alac,amr,ape,au,awb,dct,dss,dvf,flac,gsm,iklax,ivs,m4a,m4b,mmf,mp3,mpc,msv,nmf,nsf,ogg,oga,mogg,opus,ra,rm,raw,rf64,sln,tta,voc,vox,wav,wma,wv,8svx,cda}",
  // Video
  "**/*.{webm,mkv,flv,vob,ogv,drc,gifv,mng,avi,mov,qt,wmv,yuv,rmvb,asf,amv,mp4,m4p,m4v,mpg,mp2,mpeg,mpv,m2v,m4v,svi,3g2,mxf,roq,nsv,aa}",
];

const lockfilePatterns = [
  "**/package-lock.json",
  "**/yarn.lock",
  "**/composer.lock",
];

export function prepareWeights(weights, withMedia, withLockfiles) {
  if (!withMedia) {
    for (const pattern of mediaPatterns) {
      if (!Object.hasOwn(weights, pattern)) {
        weights[pattern] = 0;
      }
    }
  }

  if (!withLockfiles) {
    for (const pattern of lockfilePatterns) {
      if (!Object.hasOwn(weights, pattern)) {
        weights[pattern] = 0;
      }
    }
  }

  const methods = Object.entries(weights).map(([glob, weight]) => [
    mm.matcher(glob),
    weight,
  ]);

  // Add a default method with a weight of 1
  methods.push([() => true, 1]);

  return (file) => methods.find(([fn]) => fn(file))[1];
}

export function sortByLinesDesc(elements) {
  elements.sort((a, b) => {
    if (a.lines < b.lines) {
      return 1;
    }
    if (a.lines > b.lines) {
      return -1;
    }

    return 0;
  });

  return elements;
}
