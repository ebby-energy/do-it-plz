import { expect, it, mock } from "bun:test";
import { z } from "zod";
import { initDoItPlz } from "./client";

console.log = mock(() => {});

let count = 0;
const dip = initDoItPlz({
  "added-number": {
    payload: z.object({
      label: z.string(),
    }),
  },
  "removed-number": {},
  "received-string": {
    payload: z.string(),
  },
  "fever-detected": {},
  "needs-more-cowbell": {},
});
dip.register({
  incrementCount: dip.on({ event: "added-number" }).doIt(async ({ plz }) => {
    plz("Add one to count", () => count++);
    console.log("done incrementing");
  }),
  logLabel: dip
    .on({ event: "added-number" })
    .doIt(async ({ payload: { label } }) => {
      console.log(`LOG: label is ${label}`);
    }),
  logString: dip.on({ event: "received-string" }).doIt(async ({ payload }) => {
    console.log(`LOG: string is ${payload}`);
  }),
  decrementCount: dip.on({ event: "removed-number" }).doIt(async () => {
    count--;
  }),
  checkForFever: dip.on({ event: "fever-detected" }).doIt(async ({ plz }) => {
    plz("Play the cowbell", async () => {
      await dip.fireEvent("needs-more-cowbell");
    });
  }),
  moreCowbell: dip.on({ event: "needs-more-cowbell" }).doIt(() => {
    console.log("dink dink dink dink");
  }),
});

it("should work for event with payload", async () => {
  await dip.fireEvent("added-number", { label: "blah" });
  expect(count).toBe(1);
});

it("should work for event without payload", async () => {
  const currentCount = count;
  await dip.fireEvent("removed-number");
  expect(count).toBe(currentCount - 1);
});

it("should fail without required payload", async () => {
  expect(dip.fireEvent("added-number")).rejects.toThrow();
});

it("should fail with invalid event name", async () => {
  // @ts-expect-error intentionally invalid event name
  expect(dip.fireEvent("invalid-event-name")).rejects.toThrow();
});

it("should console log on success", async () => {
  await dip.fireEvent("added-number", { label: "blah" });
  expect(console.log).toHaveBeenCalledWith("done incrementing");
});

it("should print log message from string payload", async () => {
  await dip.fireEvent("received-string", "hello");
  expect(console.log).toHaveBeenCalledWith("LOG: string is hello");
});

it("should print log message from object payload", async () => {
  await dip.fireEvent("added-number", { label: "blah" });
  expect(console.log).toHaveBeenCalledWith("LOG: label is blah");
});

it("should fail with invalid payload type", async () => {
  // @ts-expect-error label should be a string
  expect(dip.fireEvent("added-number", { label: 123 })).rejects.toThrow();
});

it("should fail with invalid payload key", async () => {
  expect(
    // @ts-expect-error payload should have a label key
    dip.fireEvent("added-number", { label2: "123" })
  ).rejects.toThrow();
});

it("should fire second event from plz in first handler", async () => {
  await dip.fireEvent("fever-detected");
  expect(console.log).toHaveBeenCalledWith("dink dink dink dink");
});
