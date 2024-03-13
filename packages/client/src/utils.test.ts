import { DIPError } from "@do-it-plz/core";
import { expect, it } from "bun:test";
import { jsonStringifyError } from "./utils";

it("should serialize DIPError", () => {
  const error = new DIPError({
    code: "BAD_REQUEST",
    message: "Bad request",
  });
  const stringified = jsonStringifyError(error);
  const parsed = JSON.parse(stringified);

  expect(parsed.name).toEqual("DIPError");
  expect(parsed.code).toEqual("BAD_REQUEST");
  expect(parsed.message).toEqual("Bad request");
  expect(parsed.stack).toBeDefined();
});

it("should serialize Error", () => {
  const error = new Error("Unknown error");
  const stringified = jsonStringifyError(error);
  const parsed = JSON.parse(stringified);

  expect(parsed.name).toEqual("Error");
  expect(parsed.code).toEqual("Unknown");
  expect(parsed.message).toEqual("Unknown error");
  expect(parsed.stack).toBeDefined();
});

it("should serialize unknown error", () => {
  const error = "Unknown error";
  const stringified = jsonStringifyError(error);
  const parsed = JSON.parse(stringified);

  expect(parsed).toEqual("Unknown error type of string");
});
