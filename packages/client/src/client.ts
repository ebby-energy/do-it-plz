import {
  packageName,
  packageVersion,
  // @ts-ignore - this is dynamically generated with `build:package-info`
} from "@do-it-plz/client/src/__metadata" with { type: "macro" };
import { DIPError } from "@do-it-plz/core";
import { createId } from "@paralleldrive/cuid2";
import { SafeParseSuccess, z } from "zod";
import { sendEvent, sendPlz } from "./remote-send";
import { jsonStringifyError, updateStack } from "./utils";

const DO_IT_PLZ_API_URL = "https://do-it-plz.com/api";

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, never>>;
  }[Keys];

type EventOptions = {
  payload?: z.ZodTypeAny;
};

export type Events = {
  [eventName: string]: EventOptions | undefined;
};

type EventName<T extends Events> = keyof T;

type EventPayload<
  TEvents,
  TEventName extends keyof TEvents,
> = TEvents[TEventName] extends {
  payload: z.ZodTypeAny;
}
  ? z.infer<TEvents[TEventName]["payload"]>
  : never;

type SleepOptions = {
  days?: number;
  minutes?: number;
};

type PlzOptions = {
  /**
   * Number of retries to attempt before failing (default: 3)
   */
  retries?: number;
};

const DEFAULT_PLZ_OPTIONS = {
  retries: 3,
} satisfies PlzOptions;

type Args<T extends Events, TEventName extends EventName<T>> = {
  plz: <HandlerResult>(
    name: string,
    func: () => Promise<HandlerResult> | HandlerResult,
    options?: PlzOptions,
  ) => Promise<HandlerResult> | HandlerResult;
  sleep: (opts: RequireAtLeastOne<SleepOptions>) => Promise<void>;
  payload: EventPayload<T, TEventName>;
};

type EventHandler<T extends Events, TEventName extends EventName<T>> = {
  event: TEventName;
  taskHandler: (args: Args<T, TEventName>) => Promise<void> | void;
};

async function plz<HandlerResult>(
  subTaskName: string,
  subTaskHandler: () => Promise<HandlerResult>,
): Promise<HandlerResult>;
function plz<HandlerResult>(
  subTaskName: string,
  subTaskHandler: () => HandlerResult,
): HandlerResult;

async function plz<HandlerResult>(
  subTaskName: string,
  subTaskHandler: () => HandlerResult | Promise<HandlerResult>,
): Promise<HandlerResult | void> {
  if (subTaskHandler instanceof Function) {
    console.log("SUBTASK START: ", subTaskName);
    const result = subTaskHandler();
    if (result instanceof Promise) {
      await result;
    }
    console.log("SUBTASK END  : ", subTaskName);
    return result;
  }
}

const sleep = async (opts: RequireAtLeastOne<SleepOptions>) => {
  console.log(opts);
};

export type Options = {
  clientId: string;
  clientName: string;
  clientVersion: string;
  remoteUrl?: string;
};

type ClientOptions<TEvents> = {
  events: TEvents;
  options: Options;
};

type JSONStringifiedError = string;

export type StackSuccess = {
  id: string;
  name: string;
  status: "success";
  result: any;
};
export type StackError = {
  id: string;
  name: string;
  status: "error";
  attempt: number;
  error: JSONStringifiedError;
};

export type StackItem = StackSuccess | StackError;
export type Stack = Array<StackItem>;

export class DoItPlzClient<TEvents extends Events = Events> {
  private events: TEvents = {} as TEvents;
  private packageMetadata: Options;
  private tasks: Record<string, EventHandler<TEvents, EventName<TEvents>>> = {};
  private eventMap: { [K in EventName<TEvents>]?: string[] } = {};
  private urls: {
    events: string;
    tasks: string;
    subtasks: string;
  };

  constructor({
    events,
    options: { remoteUrl = DO_IT_PLZ_API_URL, ...packageMetadata },
  }: ClientOptions<TEvents>) {
    this.events = events;
    this.packageMetadata = packageMetadata;
    this.urls = {
      events: `${remoteUrl}/events`,
      tasks: `${remoteUrl}/tasks`,
      subtasks: `${remoteUrl}/subtasks`,
    };
  }

  register = (
    tasks: Record<string, EventHandler<TEvents, EventName<TEvents>>>,
  ) => {
    Object.entries(tasks).forEach(([taskName, taskHandler]) => {
      this.tasks[taskName] = taskHandler;
      if (!this.eventMap[taskHandler.event]) {
        this.eventMap[taskHandler.event] = [];
      }
      this.eventMap[taskHandler.event]!.push(taskName);
    });
    return this;
  };

  on = <TEventName extends EventName<TEvents>>({
    event,
  }: {
    event: TEventName;
  }) => {
    return {
      doIt: (taskHandler: EventHandler<TEvents, TEventName>["taskHandler"]) => {
        return {
          event,
          taskHandler,
        };
      },
    };
  };

  private parsePayload = <TEventName extends EventName<TEvents>>(
    event: TEventName,
    payload?: EventPayload<TEvents, TEventName>,
  ) => {
    const payloadSchema = this.events[event]?.payload;
    if (!payloadSchema)
      return { success: true, data: payload } as SafeParseSuccess<
        typeof payload
      >;
    return payloadSchema.safeParse(payload);
  };

  fireEvent = async <TEventName extends EventName<TEvents>>(
    event: TEventName,
    payload?: EventPayload<TEvents, TEventName>,
  ) => {
    console.log("EVENT FIRED  : ", event);
    try {
      const handlerNames = this.eventMap[event];
      if (!handlerNames) {
        // Maybe this shouldn't be an error...
        throw new DIPError({
          code: "EVENT_NOT_FOUND",
          message: `No event registered for "${String(event)}"`,
        });
      }
      const validated = this.parsePayload(event, payload);
      if (!validated.success) {
        throw new DIPError({
          code: "INVALID_PAYLOAD",
          message: `Invalid payload for "${String(event)}"`,
        });
      }
      await sendEvent({
        url: this.urls.events,
        event: {
          name: String(event),
          payload: validated.data,
          taskNames: handlerNames,
        },
        metadata: this.packageMetadata,
      });
    } catch (err) {
      console.log(err);
      if (err instanceof DIPError) {
        throw err;
      }
      throw new DIPError({
        code: "UNKNOWN_ERROR",
        message: "INTERNAL SERVER ERROR",
      });
    }
  };

  // TODO: Figure out how to type the payload
  callTask = async (
    taskName: string,
    payload?: any,
    stack: Stack = [] as Stack,
  ) => {
    const handler = this.tasks[taskName];
    if (!handler) {
      throw new DIPError({
        code: "TASK_NOT_FOUND",
        message: `No handler registered for "${String(taskName)}"`,
      });
    }
    const eventName = handler.event;
    const validated = this.parsePayload(eventName, payload);
    if (!validated.success) {
      throw new DIPError({
        code: "INVALID_PAYLOAD",
        message: `Invalid payload for "${String(taskName)}"`,
      });
    }
    console.log(
      `CALLING TASK : "${taskName}" FROM EVENT "${String(eventName)}"`,
    );
    await handler.taskHandler({
      plz: async <HandlerResult>(
        name: string,
        func: () => Promise<HandlerResult> | HandlerResult,
        subTaskOptions?: PlzOptions,
      ) => {
        const id = `plz-${createId()}`;
        const metadata = this.packageMetadata;
        const options = Object.assign({}, DEFAULT_PLZ_OPTIONS, subTaskOptions);
        const subtask = stack.find((s) => s.name === name);
        if (subtask?.status === "success") {
          return subtask.result;
        }
        const existingAttempt = subtask?.attempt;
        const { retries } = options;
        if (existingAttempt && existingAttempt < 0) {
          throw new DIPError({
            code: "BAD_REQUEST",
            message: "Attempt must be a positive number",
          });
        }
        if (retries < 0) {
          throw new DIPError({
            code: "BAD_REQUEST",
            message: "Retries must be a positive number",
          });
        }
        const attempt = subtask ? subtask.attempt + 1 : 0;
        if (attempt !== 0 && attempt >= retries) {
          throw new DIPError({
            code: "TOO_MANY_ATTEMPTS",
            message: `Exceeded maximum retries, ${attempt} / ${retries}`,
          });
        }
        try {
          const result = await plz(name, func);
          const stackItem = { id, name, status: "success" as const, result };
          stack = updateStack(stack, name, !!subtask, stackItem);
          await sendPlz({ url: this.urls.subtasks, stack, metadata });
          return result;
        } catch (err) {
          const stackItem = {
            id,
            name,
            status: "error" as const,
            attempt,
            error: jsonStringifyError(err),
          };
          stack = updateStack(stack, name, !!subtask, stackItem);
          await sendPlz({ url: this.urls.subtasks, stack, metadata });
          throw err;
        }
      },
      sleep,
      payload: validated.data,
    });
  };
}

type InitDoItPlz<TEvents> = {
  events: TEvents;
  options?: { clientId?: string };
};
export const initDoItPlz = <TEvents extends Events>({
  events,
  options,
}: InitDoItPlz<TEvents>) => {
  const clientId = options?.clientId ?? process.env.DO_IT_PLZ_CLIENT_ID;
  if (!clientId) {
    throw new Error("DO_IT_PLZ_CLIENT_ID is not set");
  }
  const clientOptions = {
    clientId,
    clientName: packageName(),
    clientVersion: packageVersion(),
  } satisfies Options;
  return new DoItPlzClient<TEvents>({ events, options: clientOptions });
};
