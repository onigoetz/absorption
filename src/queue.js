const cliProgress = require("cli-progress");

// We want to parallelize as much as possible,
// but we certainly don't want to kill the machine it's running on.
// This process will run 5 elements in paralels or cpu cores/2 whichever comes first
const cpus = require("os").cpus().length;

const maxProcess = Math.min(5, Math.max(1, Math.floor(cpus / 2)));

module.exports = class Queue {
  constructor(verbose = false) {
    this.total = 0;
    this.finishedElements = 0;

    this.queue = [];
    this.inFlight = [];

    this.triggerDone = () => {};

    this.verbose = verbose;
    // In verbose mode, we don't want a progress bar, replace it with a no-op
    this.progress = verbose
      ? {
          start() {},
          stop() {},
          setTotal() {},
          increment() {}
        }
      : new cliProgress.SingleBar({
          format: "Scanning {bar} | {percentage}% | {value}/{total}",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591"
        });
    this.running = false;
  }

  debug(...output) {
    if (this.verbose) {
      console.log(...output);
    }
  }

  async run(item) {
    this.debug("Running", item.name);

    try {
      await item.fn();
    } catch (e) {
      console.error("Failed item in queue", e);
    }

    this.done(item);
  }

  add(item) {
    this.total++;

    if (this.running) {
      this.progress.setTotal(this.total);
    } else {
      this.running = true;
      this.progress.start(1, 0);
    }

    this.queue.unshift(item);
    this.next();
  }

  done(currentItem) {
    this.progress.increment();
    this.finishedElements++;

    // remove from inFlight list
    this.inFlight = this.inFlight.filter(item => item !== currentItem);

    this.next();
  }

  next() {
    // Don't start a new task if it already has the maximum tasks running
    if (this.inFlight.length >= maxProcess) {
      this.debug(
        `Max items inflight (${this.inFlight.length}), waiting (${this.queue.length} left in queue)`
      );
      return;
    }

    if (this.inFlight.length === 0 && this.queue.length === 0) {
      this.debug("Queue and inflight done. Closing queue");
      this.running = false;
      this.progress.stop();
      this.triggerDone();

      return;
    }

    // Nothing left to do
    if (this.queue.length === 0) {
      this.debug("Queue empty, waiting for last elements to finish");
      return;
    }

    // Get the first item from the queue, and run it
    const item = this.queue.pop();
    this.inFlight.push(item);

    this.run(item);
  }

  await() {
    // We're already done with the items on the queue
    if (this.inFlight.length === 0 && this.queue.length === 0) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      // Store on the class the function to signal the queue is finished
      this.triggerDone = resolve;
    });
  }
};
