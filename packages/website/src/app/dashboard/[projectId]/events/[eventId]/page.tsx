import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProjectDB } from "@/db/project";
import { decrypt } from "@/utils/crypto";
import { KeyRound } from "lucide-react";
import { notFound } from "next/navigation";

type Props = { params: { projectId: string; eventId: string } };
export default async function EventViewPage({
  params: { projectId, eventId },
}: Props) {
  const db = createProjectDB({ projectId });
  const event = await db.query.events.findFirst({
    columns: {
      id: true,
      name: true,
      origin: true,
      taskNames: true,
      createdAt: true,
      iv: true,
      payload: true,
      metadata: true,
    },
    where: (event, { and, eq }) =>
      and(eq(event.id, eventId), eq(event.projectId, projectId)),
  });
  if (!event) notFound();
  const payload = await decrypt(
    event.payload,
    process.env.SECRET_KEY!,
    event.iv,
  );
  const parsedPayload = JSON.parse(payload);
  const client = event.metadata
    ? `${event.metadata.clientName}@${event.metadata.clientVersion}`
    : "Unknown client";
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-start gap-y-12">
      <h1 className="text-4xl font-bold">Event Details</h1>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-mono">&apos;{event.name}&apos;</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Origin</p>
            <p className="text-muted-foreground text-md">{event.origin}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Created</p>
            <p className="text-muted-foreground text-md">
              {new Date(event.createdAt).toISOString()}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium leading-none">Payload</p>
              <Badge variant="outline">
                <KeyRound className="mr-2 h-3 w-3" />
                Encrypted end-to-end
              </Badge>
            </div>
            <pre className="text-muted-foreground whitespace-pre-wrap font-mono text-sm">
              {JSON.stringify(parsedPayload, null, 2)}
            </pre>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Tasks</p>
            <p className="text-muted-foreground text-md">
              {event.taskNames?.join(", ") ?? "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Client</p>
            <p className="text-muted-foreground text-md">{client}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
