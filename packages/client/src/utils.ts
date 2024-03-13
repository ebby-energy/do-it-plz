import { DIPError } from "@do-it-plz/core";
import type { Stack, StackItem } from "./client";

export const jsonStringifyError = (err: unknown) => {
  if (err instanceof DIPError) {
    const { name, message, stack, code } = err;
    return JSON.stringify({ name, message, stack, code });
  }
  if (err instanceof Error) {
    const { name, message, stack } = err;
    const code = "Unknown";
    return JSON.stringify({ name, message, stack, code });
  }
  return JSON.stringify(`Unknown error type of ${typeof err}`);
};

export const updateStack = (
  stack: Stack,
  name: string,
  exists: boolean,
  stackItem: StackItem,
) => {
  if (!exists) return [...stack, stackItem];
  return stack.map((s) => {
    if (s.name === name) {
      return stackItem;
    }
    return s;
  });
};
