import { expect, it, vitest } from "vitest";
import { z } from "zod";
import { initDoItPlz } from "./dip";

let count = 0;
const dip = initDoItPlz({
  "added-number": {
    payload: z.object({
      label: z.string(),
    }),
  },
  "removed-number": {},
});
dip.register({
  incrementCount: dip
    .on("added-number")
    .handle(async () => {
      count++;
      return "hi";
    })
    .onSuccess((result) => console.log(result))
    .onFailure((err) => console.log(err)),
  logLabel: dip.on("added-number").handle(async (payload) => {
    console.log(payload?.label);
  }),
  decrementCount: dip.on("removed-number").handle(async () => {
    count--;
  }),
});

it("should work for event with payload", async () => {
  await dip.fire("added-number", { label: "blah" });
  expect(count).toBe(1);
});

it("should work for event without payload", async () => {
  await dip.fire("removed-number");
  expect(count).toBe(0);
});

it("should fail without required payload", async () => {
  await expect(dip.fire("added-number")).rejects.toThrow();
});

it("should fail with invalid event name", async () => {
  // @ts-expect-error intentionally invalid event name
  await expect(dip.fire("invalid-event-name")).rejects.toThrow();
});

it("should console log on success", async () => {
  const consoleLog = console.log;
  console.log = vitest.fn();
  await dip.fire("added-number", { label: "blah" });
  expect(console.log).toHaveBeenCalledWith("hi");
  console.log = consoleLog;
});

it("should fail with invalid payload type", async () => {
  // @ts-expect-error label should be a string
  await expect(dip.fire("added-number", { label: 123 })).rejects.toThrow();
});

it("should fail with invalid payload key", async () => {
  // @ts-expect-error payload should have a label key
  await expect(dip.fire("added-number", { label2: "123" })).rejects.toThrow();
});
