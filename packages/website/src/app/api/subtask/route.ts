import { withAxiom, type AxiomRequest } from "next-axiom";

export const POST = withAxiom(async (req: AxiomRequest) => {
  const body = await req.json();
  req.log.info("POSTING with data", { body });
  return Response.json({ success: true });
});
