import { db } from "@/db/parent";
import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

const getOrganization = db.query.organizations
  .findMany({
    columns: {
      id: true,
      name: true,
      publicId: true,
      createdAt: true,
    },
    where: (org, { eq }) => eq(org.id, sql.placeholder("id")),
  })
  .prepare();

type ComponentProps = {
  publicId: string;
  name: string;
};
const Component = ({ publicId, name }: ComponentProps) => {
  return (
    <>
      <p>Project: {name}</p>
      <Link
        className="text-foreground font-medium hover:underline"
        href={`/dashboard/${publicId}/settings`}
      >
        Go to Settings
      </Link>
    </>
  );
};

export default async function Page() {
  const { orgId, userId } = auth();

  if (!orgId && !userId) {
    notFound();
  }

  if (orgId) {
    const results = await getOrganization.all({ id: orgId });
    if (results.length === 0) {
      return <p>No projects found for organization</p>;
    }
    return results.map((result) => (
      <Component
        key={result.publicId}
        name={result.name}
        publicId={result.publicId}
      />
    ));
  }

  if (userId) {
    const results = await getOrganization.all({ id: userId });
    if (results.length === 0) {
      return <p>No projects found for user</p>;
    }
    return results.map((result) => (
      <Component
        key={result.publicId}
        name={result.name}
        publicId={result.publicId}
      />
    ));
  }
}
