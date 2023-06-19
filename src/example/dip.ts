import { z } from "zod";

class DoItPlzClient {
  events: any;
  /**
   * {
   *   "eventName": {
   *     handler: () => {},
   *     onSuccess: () => {},
   *     onFailure: () => {},
   *   }
   * }
   */
  tasks: Record<string, any>;

  constructor(events: any) {
    this.events = events;
    this.tasks = {};
  }

  register = (tasks: Record<string, any>) => {
    Object.entries(tasks).forEach(([name, handler]) => {
      this.tasks[handler.event] = handler;
    });
    return this;
  };

  on = (event: any) => {
    return {
      handle: (handler: any) => {
        return {
          // Do we really need to do this nested thing?
          // What if we want something more than onSuccess and onFailure? eek.
          onSuccess: (onSuccess: any) => {
            return {
              onFailure: (onFailure: any) => {
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
          onFailure: (onFailure: any) => {
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

  /**
   *
   * This currently only fires events locally and does not
   * do any remote calls. This is mostly here for shape definition
   * and refining types throughout.
   *
   * @param event
   * @param payload
   */
  fire = async (event: any, payload?: any) => {
    const {
      handler,
      onSuccess = () => {},
      onFailure = () => {},
    } = this.tasks[event];
    await handler(payload)
      .then((res: any) => onSuccess(res))
      .catch((err: any) => onFailure(err));
  };
}

export const initDoItPlz = function (events: any, context?: unknown) {
  return new DoItPlzClient(events);
};
