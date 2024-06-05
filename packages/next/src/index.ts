import { DoItPlzClient, Options, type Events } from "@do-it-plz/client";
import { DIPError } from "@do-it-plz/core";
import {
  packageName,
  packageVersion,
  // @ts-ignore - this is dynamically generated with `build:package-info`
} from "@do-it-plz/next/src/__metadata" with { type: "macro" };
import { NextResponse } from "next/server";

type Client = DoItPlzClient<any>;

type InitDoItPlz<TEvents> = {
  events: TEvents;
  options?: { projectId?: string; token?: string; origin: string };
};
export const initDoItPlz = <TEvents extends Events>({
  events,
  options,
}: InitDoItPlz<TEvents>) => {
  const projectId = options?.projectId ?? process.env.DIP_PROJECT_ID;
  if (!projectId) {
    throw new Error("DIP_PROJECT_ID is not set");
  }
  const token = options?.token ?? process.env.DIP_TOKEN;
  if (!token) {
    throw new Error("DIP_TOKEN is not set");
  }
  const origin = options?.origin;
  if (!origin) {
    throw new Error("Origin is required");
  }
  const clientOptions = {
    projectId,
    token,
    origin,
    clientName: packageName(),
    clientVersion: packageVersion(),
  } satisfies Options;
  return new DoItPlzClient<TEvents>({ events, options: clientOptions });
};

type DoItPlzRouteHandlerOpts = {
  client: Client;
};
export const createDoItPlzRouteHandler = ({
  client,
}: DoItPlzRouteHandlerOpts) => {
  const POST = async (
    request: Request,
    { params }: { params: { name?: string[] } },
  ) => {
    const { name } = params;
    const taskName = name && name[0] ? name[0] : "";
    let payload = undefined;
    // check for empty body
    if (request.headers.get("content-length") !== "0") {
      payload = await request.json();
    }
    try {
      await client.callTask(taskName, payload);
    } catch (err) {
      console.log(err);
      if (err instanceof DIPError) {
        return NextResponse.json(
          {
            success: false,
            message: err.message,
            code: err.code,
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: "INTERNAL SERVER ERROR",
          code: "UNKNOWN_ERROR",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true }, { status: 200 });
  };

  return {
    POST,
  };
};
