import { dip } from "@/server/dip";
import { createDoItPlzRouteHandler } from "@do-it-plz/next";

export const dynamic = "force-dynamic";

export const { POST } = createDoItPlzRouteHandler({
  client: dip,
});
