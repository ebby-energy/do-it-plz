import { SafeParseSuccess, z } from "zod";
import { DIPError } from "../../core/src/error";

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

type Events = {
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

type Args<T extends Events, TEventName extends EventName<T>> = {
  plz: <HandlerResult>(
    name: string,
    func: () => Promise<HandlerResult> | HandlerResult
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
  subTaskHandler: () => Promise<HandlerResult>
): Promise<HandlerResult>;
function plz<HandlerResult>(
  subTaskName: string,
  subTaskHandler: () => HandlerResult
): HandlerResult;

async function plz<HandlerResult>(
  subTaskName: string,
  subTaskHandler: () => HandlerResult | Promise<HandlerResult>
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

type ClientOptions<TEvents> = {
  events: TEvents;
};

export class DoItPlzClient<TEvents extends Events = Events> {
  private events: TEvents = {} as TEvents;
  private tasks: Record<string, EventHandler<TEvents, EventName<TEvents>>> = {};
  private eventMap: { [K in EventName<TEvents>]?: string[] } = {};

  constructor({ events }: ClientOptions<TEvents>) {
    this.events = events;
  }

  register = (
    tasks: Record<string, EventHandler<TEvents, EventName<TEvents>>>
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
    payload?: EventPayload<TEvents, TEventName>
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
    payload?: EventPayload<TEvents, TEventName>
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

      for (const name of handlerNames) {
        console.log(`CALLING TASK : "${name}" FROM EVENT "${String(event)}"`);
        await this.callTask(name, validated.data);
      }
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
  callTask = async (taskName: string, payload?: any) => {
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
    await handler.taskHandler({ plz, sleep, payload: validated.data });
  };
}

export const initDoItPlz = <TEvents extends Events>(events: TEvents) => {
  return new DoItPlzClient<TEvents>({ events });
};
