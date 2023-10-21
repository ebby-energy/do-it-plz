import { NextResponse } from "next/server";

const createClient = () => {
  const POST = async (
    request: Request,
    { params }: { params: { name?: string[] } }
  ) => {
    const { name } = params;
    return NextResponse.json({ name });
  };

  return {
    POST,
  };
};

export const { POST } = createClient();
