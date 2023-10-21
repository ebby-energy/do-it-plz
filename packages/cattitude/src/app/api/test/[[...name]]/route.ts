import { NextResponse } from "next/server";

const createClient = () => {
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
    return NextResponse.json({ taskName, payload });
  };

  return {
    POST,
  };
};

export const { POST } = createClient();
