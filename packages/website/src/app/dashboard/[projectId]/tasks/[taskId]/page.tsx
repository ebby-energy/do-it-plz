import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db as parentDB } from "@/db/parent";
import { createProjectDB } from "@/db/project";
import { auth } from "@clerk/nextjs/server";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "../_components/status-badge";

type Props = { params: { projectId: string; taskId: string } };
export default async function TaskViewPage({
  params: { projectId, taskId },
}: Props) {
  const { orgId } = auth();
  const org = await parentDB.query.organizations.findFirst({
    columns: {
      id: true,
      token: true,
      iv: true,
    },
    where: (org, { eq }) => eq(org.publicId, projectId),
  });
  if (!org) notFound();
  if (org.id !== orgId) notFound();
  const db = createProjectDB({ projectId });
  const task = await db.query.tasks.findFirst({
    with: {
      event: {
        columns: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
    },
    columns: {
      id: true,
      name: true,
      eventId: true,
      origin: true,
      status: true,
      complete: true,
      createdAt: true,
    },
    where: (event, { and, eq }) =>
      and(eq(event.id, taskId), eq(event.projectId, projectId)),
    orderBy: (e, { desc }) => desc(e.createdAt),
  });
  if (!task) notFound();
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-start gap-y-12">
      <h1 className="text-4xl font-bold">Task Details</h1>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <div className="flex flex-row items-center justify-between gap-4">
              <h1 className="font-mono">&apos;{task.name}&apos;</h1>
              <StatusBadge status={task.status} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Origin</p>
            <p className="text-muted-foreground text-md">{task.origin}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Created</p>
            <p className="text-muted-foreground text-md">
              {`${new Date(task.createdAt).toISOString()} (${formatDistanceToNow(task.createdAt, { addSuffix: true })})`}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Subtasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-md">
            No subtasks for this task.
          </p>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Source Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Name</p>
            <p className="text-muted-foreground text-md font-mono">
              &apos;{task.event.name}&apos;
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Created</p>
            <p className="text-muted-foreground text-md">
              {`${new Date(task.event.createdAt).toISOString()} (${formatDistanceToNow(task.event.createdAt, { addSuffix: true })})`}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Link
            href={`/dashboard/${projectId}/events/${task.event.id}`}
            className="flex w-full flex-row items-center justify-center text-sm"
          >
            View Event
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
