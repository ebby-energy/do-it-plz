import { withAxiom, type AxiomRequest } from "next-axiom";

export const runtime = "edge";

export const POST = withAxiom(async (req: AxiomRequest) => {
  const body = await req.json();
  const headers = new Headers(req.headers);
  const log = req.log.with({ body, headers });
  log.info("POSTING with data");
  return Response.json({ success: true });
});
