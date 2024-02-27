export async function POST(request: Request) {
  const body = await request.json();
  console.log("POSTING with request", { request, body });
  return Response.json({ success: true });
}
