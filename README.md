# Absorption

[![Latest Version](https://img.shields.io/github/release/onigoetz/absorption.svg?style=flat-square)](https://github.com/onigoetz/absorption/releases)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](https://github.com/onigoetz/absorption/blob/master/LICENSE.md)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/onigoetz/absorption/nodejs.yml?style=flat-square&logo=github)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=onigoetz_absorption&metric=coverage)](https://sonarcloud.io/dashboard?id=onigoetz_absorption)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=onigoetz_absorption&metric=alert_status)](https://sonarcloud.io/dashboard?id=onigoetz_absorption)
[![NPM Downloads](https://img.shields.io/npm/dw/absorption?style=flat-square&logo=npm)](https://www.npmjs.com/package/absorption)

## What is absorption ?

Absorption is a small tool that gives you a knowledge absorption score for a git repository.

This is an approach to answer the questions **Who has the knowledge on this repository?** and **What is the bus factor on this repository?**

Like all one dimension metric, this metric is not a silver bullet, by using the last person to modifiy a line of code to define it's owner, we will for example miscalculate if there was a mass reformating on the repository.
Also, since we are not language aware, we will measure empty lines and there is no notion of importance of a file.

## How does it work ?

The approach we take is for each file in a repository, gather how many lines were written per contributor and when.

Then by using a thresold date (1 year by default) we sort the elements in two buckets : commits made before the thresold and commits made after.

This allows us to go in the last step of the process, sorting all those commits in three categories :

- Fresh : Code that was modified recently (after the thresold)
- Fading : Code that was modified before the threshold but by a contributor who was also active more recently
- Lost : Code that was modified by somebody no longer active on the repository

This, in turn will give you a bus factor : How many people need to stop commiting on a project for it to be in danger.
By default

## Installation

```bash
npm install -g absorption
```

## How to use it

```bash
absorption /absolute/path/to/cloned/repository
```

Will give you useful information already.
You can then use the options of the command to fine tune the results.

- `--threshold 6m` After what delay do you consider the knowledge lost. starts with a number, followed by 'd' for days, 'w' for weeks, 'm' for months or 'y' for years (1y, 6m, 9w). Defaults to one year.
- `--contributors contributors.json` Feed data on contributors, see below for that file's format.
- `--weights weights.json` Feed data on file weights, see below for that file's format.
- `--with-media` Media files (images, audio and video) are excluded by default from the scan, setting `--with-media` will include them.
- `--with-lockfiles` Lockfiles (`package-lock.json`, `yarn.lock`, `composer.lock`) are excluded by default from the scan, setting `--with-lockfiles` will include them.
- `--verbose` Output lots of debug information
- `--json file.json` Output the raw data to a json file. (used in conjunction with `--verbose` will output raw data per file as well)
- `--max-contributors 10` Allows to customize the number of active contributors displayed in the table (default: 10)
- `--max-lost-contributors 10` Allows to customize the number of lost contributors displayed in the list (default: 10)


A more advanced example :

```
absorption /Users/onigoetz/Sites/Libs/crafty --weights weights.json --contributors contributors.json
Scanning ████████████████████████████████████████ | 100% | 492/492 files

The repository's absorption score is 16% fresh, 84% fading and 0% lost

Fresh/Fading knowledge

 Name               │    Total │    Fresh │   Fading 
────────────────────┼──────────┼──────────┼──────────
 Stéphane Goetz     │  99.51 % │  15.67 % │  83.83 % 
 Vitalii Shapovalov │   0.14 % │   0.14 % │   0.00 % 


Lost knowledge

 Name                                │    Total 
─────────────────────────────────────┼──────────
 Illia Shestakov                     │   0.19 % 
 Marie P-W <marie.wermuth@gmail.com> │   0.08 % 
 Jonas Renaudot                      │   0.05 % 
 mindhalt <mindhalt@gmail.com>       │   0.03 % 
```

### `--contributors contributors.json`

```json
[
  {
    "type": "person",
    "name": "Stéphane Goetz",
    "active": true,
    "identities": [
      "Stéphane Goetz <onigoetz@onigoetz.ch>",
      "Stéphane Goetz <stephane.goetz@swissquote.ch>",
      "Stéphane Goetz <stephane.goetz@onigoetz.ch>"
    ]
  },
  {
    "type": "bot",
    "name": "Renovate",
    "identities": ["Renovate Bot <bot@renovateapp.com>"]
  }
]
```

The fields:

- `type`: "person" or "bot", bots will be excluded from the output.
- `name`: This name will be used for display.
- `active`: (Optional) Setting this value to true, will move lost knowledge to "fading" knowledge and if false, will move "fresh" and "fading" knowledge to "lost"
- `identities`: The list of elements to match the contributors to.

### `--weights weights.json`

The weight that is given to each file can be fine tuned, for example you might want to give a higher ranking to some critical business code in an application. Or give only half the weight to tests.

A weight of `0` for a file will skip its processing entirely.

```json
{
  "**/__tests__/*": 0.5,
  "src/business/**": 2,
  "**/*.js": 1.5
}
```

## How fast is it ?

We have to run a `git blame` on every file on a repository, on small to medium repositories it takes a few seconds to one minute, on big repositories this can take a few minutes. (I ran it on github.com/babel/babel, with 18'000 files it took a little over 6 minutes on my Mac Mini)

Now the good news is that we create an incremental cache, if you rerun the command, all files that weren't modified can be read from cache.
