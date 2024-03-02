import { expect, it, mock } from "bun:test";
import { z } from "zod";
import { DIPError } from "../../core/src";
import { Stack, initDoItPlz } from "./client";

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
  "test-retry": {},
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
  testRetry: dip.on({ event: "test-retry" }).doIt(async ({ plz }) => {
    const first = await plz("Default retries", () => 4);
    const second = await plz("Two retries", () => first + 4, {
      retries: 2,
    });
    const third = await plz("Zero retries", () => second + 4, {
      retries: 0,
    });
    console.log(`result: ${third}`);
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
    dip.fireEvent("added-number", { label2: "123" }),
  ).rejects.toThrow();
});

it("should fire second event from plz in first handler", async () => {
  await dip.fireEvent("fever-detected");
  expect(console.log).toHaveBeenCalledWith("dink dink dink dink");
});

it("should error when attempts are negative", async () => {
  expect(
    dip.callTask("testRetry", {}, [
      { name: "Two retries", status: "error", attempt: -1 },
    ]),
  ).rejects.toThrow(
    new DIPError({
      code: "BAD_REQUEST",
      message: "Attempt must be a positive number",
    }),
  );
});

it("should error when attempts are greater than allowed retries", async () => {
  expect(
    dip.callTask("testRetry", {}, [
      { name: "Two retries", status: "error", attempt: 3 },
    ]),
  ).rejects.toThrow(
    new DIPError({
      code: "TOO_MANY_ATTEMPTS",
      message: "Exceeded maximum retries, 3 / 2",
    }),
  );
});

it("should error when attempts are equal allowed retries", async () => {
  expect(
    dip.callTask("testRetry", {}, [
      { name: "Two retries", status: "error", attempt: 2 },
    ]),
  ).rejects.toThrow(
    new DIPError({
      code: "TOO_MANY_ATTEMPTS",
      message: "Exceeded maximum retries, 2 / 2",
    }),
  );
});

it("should error when retries are zero and attempts are greater than zero", async () => {
  expect(
    dip.callTask("testRetry", {}, [
      { name: "Zero retries", status: "error", attempt: 1 },
    ]),
  ).rejects.toThrow(
    new DIPError({
      code: "TOO_MANY_ATTEMPTS",
      message: "Exceeded maximum retries, 1 / 0",
    }),
  );
});

it("should not error when retries are zero and no attempts made yet", async () => {
  expect(dip.callTask("testRetry", {}, []));
});

it("should error when attempts are greater than default retries", async () => {
  expect(
    dip.callTask("testRetry", {}, [
      { name: "Default retries", status: "error", attempt: 4 },
    ]),
  ).rejects.toThrow(
    new DIPError({
      code: "TOO_MANY_ATTEMPTS",
      message: "Exceeded maximum retries, 4 / 3",
    }),
  );
});

it.each([
  [[] as Stack, "result: 12"],
  [
    [{ name: "Zero retries", status: "success", result: -2 }] as Stack,
    "result: -2",
  ],
])("should return result from plz stack", async (stack, expected) => {
  await dip.callTask("testRetry", {}, stack);
  expect(console.log).toHaveBeenCalledWith(expected);
});
