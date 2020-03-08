# Absorption

## What is absorption ?

Absorption is a small tool that gives you a knowledge absorption score for a git repository.

This is an approach to answer the questions **Who has the knowledge on this repository?** and **What is the bus factor on this repository?**

Like all one dimension metric, this metric is not a silver bullet, by using the last person to modifiy a line of code to define it's owner, we will for example miscalculate if there was a mass reformating on the repository.
Also, since we are not language aware, we will measure empty lines and there is no notion of importance of a file.

## How does it work ?

The approach we take is for each file in a repository, gather how many lines were written per contributor and when.

Then by using a thresold date (1 year by default) we sort the elements in two buckets : commits made before the thresold and commits made after.

This allows us to go in the last step of the process, sorting all those commits in three categories :
- Active : Code that was modified recently (after the thresold)
- Passive : Code that was modified before the threshold but by an active contributor
- Lost : Code that was modified by somebody no longer active on the repository

This, in turn will give you a bus factor : How many people need to stop commiting on a project for it to be in danger.
By default

## How to use it

```bash
absorption /absolute/path/to/cloned/repository
```

Will give you useful information already.
You can then use the options of the command to fine tune the results.

- `--threshold 6m` After what delay do you consider the knowledge lost. starts with a number, followed by 'd' for days, 'w' for weeks, 'm' for months or 'y' for years (1y, 6m, 9w). Defaults to one year.
- `--json file.json` Output the raw data to a json file.
- `--contributors contributors.json` Feed data on contributors, see below for that file's format.

### `--contributors`

```json
[
  {
    "type": "person",           // "person" or "bot", bots will be excluded from the output
    "name": "Stéphane Goetz",   // This name will be used for display
    "active": true,             // (Optional) can force somebody to active or inactive.
    "identities": [             // Identities can be one or more elements
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

## How fast is it ?

We have to run a `git blame` on every file on a repository, on small to medium repositories it takes a few seconds to one minute, on big repositories this can take a few minutes. (I ran it on github.com/babel/babel, with 18'000 files it took a little over 6 minutes on my Mac Mini)

Now the good news is that we create an incremental cache, if you rerun the command, all files that weren't modified can be read from cache.
