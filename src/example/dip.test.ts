import { expect, it, vitest } from "vitest";
import { z } from "zod";
import { initDoItPlz } from "./dip";

const consoleLog = console.log;

let count = 0;
const dip = initDoItPlz({
  test: {
    payload: z.object({
      label: z.string(),
    }),
  },
  test2: {},
});
dip.register({
  add: dip
    .on("test")
    .handle(async () => {
      count++;
      return "hi";
    })
    .onSuccess((result) => console.log(result))
    .onFailure((err) => console.log(err)),
  subtract: dip.on("test2").handle(async () => {
    count--;
  }),
});

it("should work for event with payload", async () => {
  await dip.fire("test", { label: "blah" });
  expect(count).toBe(1);
});

it("should work for event without payload", async () => {
  await dip.fire("test2");
  expect(count).toBe(0);
});

it("should fail without required payload", async () => {
  await expect(dip.fire("test")).rejects.toThrow();
});

it("should fail with invalid event name", async () => {
  // @ts-expect-error intentionally invalid event name
  await expect(dip.fire("invalid-event-name")).rejects.toThrow();
});

it("should console log on success", async () => {
  const consoleLog = console.log;
  console.log = vitest.fn();
  await dip.fire("test", { label: "blah" });
  expect(console.log).toHaveBeenCalledWith("hi");
  console.log = consoleLog;
});

it("should fail with invalid payload type", async () => {
  // @ts-expect-error label should be a string
  await expect(dip.fire("test", { label: 123 })).rejects.toThrow();
});

it("should fail with invalid payload key", async () => {
  // @ts-expect-error payload should have a label key
  await expect(dip.fire("test", { label2: "123" })).rejects.toThrow();
});
