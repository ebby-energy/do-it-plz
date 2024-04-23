import { withAxiom, type AxiomRequest } from "next-axiom";

export const runtime = "edge";

export const POST = withAxiom(async (req: AxiomRequest) => {
  const body = await req.json();
  const requestHeaders = new Headers(req.headers);
  const headers = {} as Record<string, string>;
  const origin = requestHeaders.get("X-DIP-ORIGIN");
  requestHeaders.forEach((value, key) => {
    headers[key] = value;
  });
  const log = req.log.with({ body, headers });
  log.info("POSTING with data");
  if (origin) {
    const response = await fetch(origin, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    console.log(await response.json());
  }
  return Response.json({ success: true });
});
