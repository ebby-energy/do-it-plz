import { NextResponse } from "next/server";
import { DoItPlzClient } from "../../client/src/client";
import { DIPError } from "../../core/src/error";

type Client = DoItPlzClient<any>;

type DoItPlzRouteHandlerOpts = {
  client: Client;
};
export const createDoItPlzRouteHandler = ({
  client,
}: DoItPlzRouteHandlerOpts) => {
  const POST = async (
    request: Request,
    { params }: { params: { name?: string[] } }
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
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: "INTERNAL SERVER ERROR",
          code: "UNKNOWN_ERROR",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true }, { status: 200 });
  };

  return {
    POST,
  };
};
