import { expect, it } from "vitest";
import { z } from "zod";
import { initDoItPlz } from "./dip";

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

it("should work", async () => {
  await dip.fire("test", { label: "blah" });
  expect(count).toBe(1);
  await dip.fire("test2");
  expect(count).toBe(0);
});
