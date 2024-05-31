import { db } from "@/db/parent";
import { redirect } from "next/navigation";

export async function GET(
  request: Request,
  { params: { id } }: { params: { id: string } },
) {
  const org = await db.query.organizations.findFirst({
    columns: {
      publicId: true,
    },
    where: (org, { eq }) => eq(org.id, id),
  });
  if (!org) redirect("/dashboard");
  redirect(`/dashboard/${org.publicId}`);
}
