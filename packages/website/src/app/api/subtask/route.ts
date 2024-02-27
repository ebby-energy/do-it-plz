import { withAxiom, type AxiomRequest } from "next-axiom";

export const POST = withAxiom(async (req: AxiomRequest) => {
  const body = await req.json();
  const log = req.log.with({ body });
  log.info("POSTING with data");
  return Response.json({ success: true });
});
