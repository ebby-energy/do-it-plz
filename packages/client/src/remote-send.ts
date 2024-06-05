import type { StackItem } from "./client";

type DoItPlzMetadata = {
  projectId: string;
  token: string;
  clientName: string;
  clientVersion: string;
  origin: string;
};

type SendEventInput = {
  url: string;
  event: {
    name: string;
    payload: any;
    taskNames: Array<string> | undefined;
  };
  metadata: DoItPlzMetadata;
};
export const sendEvent = async ({ url, event, metadata }: SendEventInput) => {
  await fetch(url, {
    method: "POST",
    body: JSON.stringify(event),
    headers: {
      "Content-Type": "application/json",
      "X-DIP-PROJECT-ID": metadata.projectId,
      "X-DIP-TOKEN": metadata.token,
      "X-DIP-CLIENT-NAME": metadata.clientName,
      "X-DIP-CLIENT-VERSION": metadata.clientVersion,
      "X-DIP-ORIGIN": metadata.origin,
    },
  });
};

type SendPlzInput = {
  url: string;
  stack: Array<StackItem>;
  metadata: DoItPlzMetadata;
};
export const sendPlz = async ({ url, stack, metadata }: SendPlzInput) => {
  await fetch(url, {
    method: "POST",
    body: JSON.stringify(stack),
    headers: {
      "Content-Type": "application/json",
      "X-DIP-PROJECT-ID": metadata.projectId,
      "X-DIP-TOKEN": metadata.token,
      "X-DIP-CLIENT-NAME": metadata.clientName,
      "X-DIP-CLIENT-VERSION": metadata.clientVersion,
      "X-DIP-ORIGIN": metadata.origin,
    },
  });
};

type SendTaskInput = {
  url: string;
  task: {
    id: string;
    name: string;
    status: "success" | "error";
  };
  metadata: DoItPlzMetadata;
};
export const sendTask = async ({ url, task, metadata }: SendTaskInput) => {
  await fetch(url, {
    method: "POST",
    body: JSON.stringify(task),
    headers: {
      "Content-Type": "application/json",
      "X-DIP-PROJECT-ID": metadata.projectId,
      "X-DIP-TOKEN": metadata.token,
      "X-DIP-CLIENT-NAME": metadata.clientName,
      "X-DIP-CLIENT-VERSION": metadata.clientVersion,
      "X-DIP-ORIGIN": metadata.origin,
    },
  });
};
