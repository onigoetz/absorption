/* global test, expect */
const Queue = require("../queue.js");

test("Runs all items", async () => {
  const q = new Queue();

  let count = 0;

  q.add({
    name: "Item 1",
    fn: () => {
      count++;
    }
  });

  q.add({
    name: "Item 2",
    fn: () => {
      count++;
    }
  });

  q.add({
    name: "Item 3",
    fn: () => {
      count++;
    }
  });

  await q.await();

  expect(count).toEqual(3);
});

test("Failures don't stop the queue", async () => {
  const q = new Queue();

  let count = 0;

  q.add({
    name: "Item 1",
    fn: () => {
      count++;
    }
  });

  q.add({
    name: "Item 2",
    fn: () => {
      throw new Error("Failed on purpose in test");
    }
  });

  q.add({
    name: "Item 3",
    fn: () => {
      count++;
    }
  });

  await q.await();

  expect(count).toEqual(2);
});
