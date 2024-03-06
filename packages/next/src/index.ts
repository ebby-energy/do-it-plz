import {
  DoItPlzClient,
  Options,
  type Events,
} from "@do-it-plz/client/src/client";
import { DIPError } from "@do-it-plz/core/src/error";
import pkg from "@do-it-plz/next/package.json";
import { NextResponse } from "next/server";

type Client = DoItPlzClient<any>;

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
    clientName: pkg.name,
    clientVersion: pkg.version,
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
