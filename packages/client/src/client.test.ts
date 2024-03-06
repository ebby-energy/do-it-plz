import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  mock,
} from "bun:test";
import { z } from "zod";
import { DIPError } from "@do-it-plz/core/src/error";
import { StackItem, initDoItPlz } from "./client";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import pkg from "@do-it-plz/client/package.json";

const urls = {
  events: "https://do-it-plz.com/api/events",
  tasks: "https://do-it-plz.com/api/tasks",
  subtasks: "https://do-it-plz.com/api/subtasks",
};

const metadata = {
  clientId: "test",
  clientName: pkg.name,
  clientVersion: pkg.version,
};

const sendEvent = mock(() => {});
const sendPlz = mock(() => {});

mock.module("./remote-send", () => ({
  sendEvent,
  sendPlz,
}));

const success = () => HttpResponse.json({ success: true });
const unhandledResolver = () => {
  throw new Error("Unhandled request");
};

const server = setupServer(
  http.post("*/api/events", success),
  http.post("*/api/tasks", success),
  http.post("*/api/subtasks", success),
  http.get("*", unhandledResolver),
  http.post("*", unhandledResolver),
);

console.log = mock(() => {});

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  sendEvent.mockClear();
  sendPlz.mockClear();
});
afterAll(() => server.close());

let count = 0;
const dip = initDoItPlz({
  events: {
    "added-number": {
      payload: z.object({
        label: z.string(),
      }),
    },
    "received-string": {
      payload: z.string(),
    },
    "fever-detected": {},
    "needs-more-cowbell": {},
    "test-retry": {},
    "test-error": {},
  },
  options: { clientId: "test" },
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
  testError: dip.on({ event: "test-error" }).doIt(async ({ plz }) => {
    await plz("Throw error", () => {
      throw new DIPError({ code: "UNKNOWN_ERROR" });
    });
  }),
});

describe("dip.fireEvent tests", () => {
  it("should work for event with object payload", async () => {
    const event = { name: "added-number" as const, payload: { label: "blah" } };
    await dip.fireEvent(event.name, event.payload);
    expect(sendEvent).toHaveBeenCalledWith({
      url: urls.events,
      event: { ...event, taskNames: ["incrementCount", "logLabel"] },
      metadata,
    });
  });

  it("should work for event without object payload", async () => {
    await dip.fireEvent("received-string", "blah");
    expect(sendEvent).toHaveBeenCalledWith({
      url: urls.events,
      event: {
        name: "received-string",
        payload: "blah",
        taskNames: ["logString"],
      },
      metadata,
    });
  });

  it("should fail without required payload", async () => {
    expect(dip.fireEvent("added-number")).rejects.toThrow();
  });

  it("should fail with invalid event name", async () => {
    // @ts-expect-error intentionally invalid event name
    expect(dip.fireEvent("invalid-event-name")).rejects.toThrow();
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
});

describe("dip.callTask", () => {
  it("should fire second event from plz in first handler", async () => {
    await dip.callTask("checkForFever");
    expect(sendEvent).toHaveBeenCalledWith({
      url: urls.events,
      event: {
        name: "needs-more-cowbell",
        taskNames: ["moreCowbell"],
      },
      metadata,
    });
  });

  it("should error when attempts are negative", async () => {
    expect(
      dip.callTask("testRetry", {}, [
        {
          id: "0",
          name: "Two retries",
          status: "error",
          attempt: -1,
          error: "hi",
        },
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
        {
          id: "0",
          name: "Two retries",
          status: "error",
          attempt: 3,
          error: "hi",
        },
      ]),
    ).rejects.toThrow(
      new DIPError({
        code: "TOO_MANY_ATTEMPTS",
        message: "Exceeded maximum retries, 4 / 2",
      }),
    );
  });

  it("should error when attempts equal allowed retries", async () => {
    expect(
      dip.callTask("testRetry", {}, [
        {
          id: "0",
          name: "Two retries",
          status: "error",
          attempt: 1,
          error: "hi",
        },
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
        {
          id: "0",
          name: "Zero retries",
          status: "error",
          attempt: 1,
          error: "hi",
        },
      ]),
    ).rejects.toThrow(
      new DIPError({
        code: "TOO_MANY_ATTEMPTS",
        message: "Exceeded maximum retries, 2 / 0",
      }),
    );
  });

  it("should not error when retries are zero and no attempts made yet", async () => {
    expect(dip.callTask("testRetry", {}, []));
  });

  it("should error when attempts are greater than default retries", async () => {
    expect(
      dip.callTask("testRetry", {}, [
        {
          id: "0",
          name: "Default retries",
          status: "error",
          attempt: 3,
          error: "hi",
        },
      ]),
    ).rejects.toThrow(
      new DIPError({
        code: "TOO_MANY_ATTEMPTS",
        message: "Exceeded maximum retries, 4 / 3",
      }),
    );
  });

  it("should not skip stack without matches", async () => {
    await dip.callTask("testRetry");
    // @ts-expect-error
    expect(sendPlz.mock.lastCall[0].stack.map((s) => s.result)).toEqual([
      4, 8, 12,
    ]);
  });

  it("should skip stack", async () => {
    await dip.callTask("testRetry", {}, [
      {
        id: "abcd",
        name: "Default retries",
        status: "success" as const,
        result: -2,
      } satisfies StackItem,
    ]);
    expect(sendPlz).toHaveBeenCalledTimes(2); // one of three skipped
    // @ts-expect-error
    expect(sendPlz.mock.lastCall[0].stack.map((s) => s.result)).toEqual([
      -2, 2, 6,
    ]);
  });

  it("should retry stack when previously errored", async () => {
    const name = "Default retries";
    await dip.callTask("testRetry", {}, [
      {
        id: "abcd",
        name,
        status: "error" as const,
        attempt: 0,
        error: "hi",
      },
    ]);
    expect(sendPlz).toHaveBeenCalledTimes(3);
    expect(
      // @ts-expect-error
      sendPlz.mock.lastCall[0].stack.find((s) => s.name === name).status,
    ).toEqual("success");
  });

  it("should send error to server", async () => {
    expect(dip.callTask("testError")).rejects.toThrow(
      new DIPError({ code: "UNKNOWN_ERROR" }),
    );
    expect(sendPlz).toHaveBeenCalledTimes(1);
    // @ts-expect-error
    const stack = sendPlz.mock.lastCall[0].stack[0];
    expect(stack.status).toEqual("error");
    expect(stack.attempt).toEqual(0);
    expect(stack.error).toBeDefined();

    const parsedError = JSON.parse(stack.error);
    expect(parsedError.name).toEqual("DIPError");
    expect(parsedError.code).toEqual("UNKNOWN_ERROR");
    expect(parsedError.message).toEqual("UNKNOWN_ERROR");
    expect(parsedError.stack).toBeDefined();
  });

  it("should send error to server with previous attempt", async () => {
    expect(
      dip.callTask("testError", {}, [
        {
          id: "0",
          name: "Throw error",
          status: "error",
          attempt: 0,
          error: "tl;dr",
        },
      ]),
    ).rejects.toThrow(new DIPError({ code: "UNKNOWN_ERROR" }));
    expect(sendPlz).toHaveBeenCalledTimes(1);
    // @ts-expect-error
    const stack = sendPlz.mock.lastCall[0].stack[0];
    expect(stack.id).not.toEqual("0");
    expect(stack.status).toEqual("error");
    expect(stack.attempt).toEqual(1);
    expect(stack.error).toBeDefined();

    const parsedError = JSON.parse(stack.error);
    expect(parsedError.name).toEqual("DIPError");
    expect(parsedError.code).toEqual("UNKNOWN_ERROR");
    expect(parsedError.message).toEqual("UNKNOWN_ERROR");
    expect(parsedError.stack).toBeDefined();
  });
});
