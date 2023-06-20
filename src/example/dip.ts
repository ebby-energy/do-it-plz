import { z } from "zod";

type EventOptions =
  | {
      payload?: z.ZodObject<any, any>;
    }
  | undefined;

type Events = {
  [eventName: string]: EventOptions;
};

type EventName<T extends Events> = keyof T;

type EventHandler<T extends Events, TEventName extends EventName<T>> = {
  event: TEventName;
  name: string;
  handler: (payload?: T[TEventName]["payload"]) => Promise<any>;
  onSuccess?: (result: any) => void;
  onFailure?: (error: any) => void;
};

class DoItPlzClient<T extends Events> {
  events: T;
  tasks: {
    [K in EventName<T>]?: EventHandler<T, K>;
  } = {};

  constructor(events: T) {
    this.events = events;
  }

  register = (
    tasks: Record<string, Omit<EventHandler<T, EventName<T>>, "name">>
  ) => {
    Object.entries(tasks).forEach(([name, handler]) => {
      this.tasks[handler.event] = {
        name,
        ...handler,
      };
    });
    return this;
  };

  on = <TEventName extends EventName<T>>(event: TEventName) => {
    return {
      handle: (handler: EventHandler<T, TEventName>["handler"]) => {
        return {
          onSuccess: (onSuccess: EventHandler<T, TEventName>["onSuccess"]) => {
            return {
              onFailure: (
                onFailure: EventHandler<T, TEventName>["onFailure"]
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
          onFailure: (onFailure: EventHandler<T, TEventName>["onFailure"]) => {
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

  fire = async <TEventName extends EventName<T>>(
    event: TEventName,
    payload?: T[TEventName]["payload"]
  ) => {
    const handler = this.tasks[event];
    if (!handler) {
      throw new Error(`No event registered for ${String(event)}`);
    }

    const {
      handler: eventHandler,
      onSuccess = () => {},
      onFailure = () => {},
    } = handler;

    await eventHandler(payload)
      .then((res: any) => onSuccess(res))
      .catch((err: any) => onFailure(err));
  };
}

export const initDoItPlz = <T extends Events>(events: T) => {
  return new DoItPlzClient(events);
};
