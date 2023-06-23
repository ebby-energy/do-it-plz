import { z } from "zod";

type EventOptions = {
  payload?: z.ZodTypeAny;
};

type Events = {
  [eventName: string]: EventOptions | undefined;
};

type EventName<T extends Events> = keyof T;

type EventPayload<
  TEvents,
  TEventName extends keyof TEvents
> = TEvents[TEventName] extends {
  payload: z.ZodTypeAny;
}
  ? z.infer<TEvents[TEventName]["payload"]>
  : never;

type EventHandler<T extends Events, TEventName extends EventName<T>> = {
  event: TEventName;
  name: string;
  handler: (payload: EventPayload<T, TEventName>) => Promise<any>;
  onSuccess?: (result: any) => void;
  onFailure?: (error: any) => void;
};

class DoItPlzClient<TEvents extends Events = Events> {
  events: TEvents;
  tasks: {
    [K in EventName<TEvents>]?: EventHandler<TEvents, K>[];
  } = {};

  constructor(events: TEvents) {
    this.events = events;
  }

  register = (
    tasks: Record<
      string,
      Omit<EventHandler<TEvents, EventName<TEvents>>, "name">
    >
  ) => {
    Object.entries(tasks).forEach(([name, handler]) => {
      if (!this.tasks[handler.event]) {
        this.tasks[handler.event] = [];
      }
      this.tasks[handler.event]!.push({
        name,
        ...handler,
      });
    });
    return this;
  };

  on = <TEventName extends EventName<TEvents>>(event: TEventName) => {
    return {
      handle: (handler: EventHandler<TEvents, TEventName>["handler"]) => {
        return {
          onSuccess: (
            onSuccess: EventHandler<TEvents, TEventName>["onSuccess"]
          ) => {
            return {
              onFailure: (
                onFailure: EventHandler<TEvents, TEventName>["onFailure"]
              ) => {
                return {
                  event,
                  handler,
                  onSuccess,
                  onFailure,
                };
              },
              event,
              handler,
              onSuccess,
            };
          },
          onFailure: (
            onFailure: EventHandler<TEvents, TEventName>["onFailure"]
          ) => {
            return {
              event,
              handler,
              onFailure,
            };
          },
          event,
          handler,
        };
      },
    };
  };

  fire = async <TEventName extends EventName<TEvents>>(
    event: TEventName,
    payload?: EventPayload<TEvents, TEventName>
  ) => {
    const handlers = this.tasks[event];
    if (!handlers) {
      // Maybe this shouldn't be an error...
      throw new Error(`No event registered for ${String(event)}`);
    }
    const payloadSchema = this.events[event]?.payload;
    if (payloadSchema) {
      payloadSchema.parse(payload);
    }

    for (const handler of handlers) {
      const {
        handler: eventHandler,
        onSuccess = () => {},
        onFailure = () => {},
      } = handler;

      await eventHandler(payload as any)
        .then((res: any) => onSuccess(res))
        .catch((err: any) => onFailure(err));
    }
  };
}

/**
 *
 * @param events The events that can be fired to trigger handlers
 * @returns A DoItPlzClient instance
 * @example
 * const dip = initDoItPlz({
 *   "user-signup": {
 *     payload: z.object({
 *       userId: z.string().uuid(),
 *       email: z.string().email(),
 *     }),
 *   },
 *   "user-count-needs-update": {},
 * });
 */
export const initDoItPlz = <TEvents extends Events>(events: TEvents) => {
  return new DoItPlzClient<TEvents>(events);
};
