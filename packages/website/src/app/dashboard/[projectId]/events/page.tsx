import { createProjectDB } from "@/db/project";
import Link from "next/link";

type Props = { params: { projectId: string } };
export default async function EventPage({ params: { projectId } }: Props) {
  const projectDB = createProjectDB({ projectId });
  const events = await projectDB.query.events.findMany({
    where: (e, { eq }) => eq(e.projectId, projectId),
  });
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-start gap-y-12">
      <h1 className="text-4xl font-bold">Events</h1>
      <div className="flex w-full flex-col gap-y-2">
        {events.map((event) => (
          <Link
            href={`/dashboard/${projectId}/events/${event.id}`}
            key={event.id}
            className="bg-card text-card-foreground flex flex-row items-center justify-between gap-4 rounded-lg border p-4 shadow-sm transition-all hover:scale-[1.02] hover:border-slate-700"
          >
            <p>&apos;{event.name}&apos;</p>
            <p>{event.createdAt.toISOString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
