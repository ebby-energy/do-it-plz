import { NextResponse } from "next/server";

export const POST = async (
  request: Request,
  { params }: { params: { name?: string[] } }
) => {
  const { name } = params;
  return NextResponse.json({ name });
};
