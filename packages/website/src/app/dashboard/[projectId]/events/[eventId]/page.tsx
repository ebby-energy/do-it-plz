import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db as parentDB } from "@/db/parent";
import { createProjectDB } from "@/db/project";
import { decrypt } from "@/utils/crypto";
import { auth } from "@clerk/nextjs/server";
import { formatDistanceToNow } from "date-fns";
import { Check, KeyRound, X } from "lucide-react";
import { notFound } from "next/navigation";

const formatPayload = (payload: string) => {
  try {
    const parsed = JSON.parse(payload);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return payload;
  }
};

const ValidityBadge = ({ valid }: { valid: boolean }) => {
  if (valid) {
    return (
      <Badge variant="outline" className="text-green-400">
        <Check className="mr-2 h-3 w-3" />
        <p>Valid payload</p>
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="text-red-400">
        <X className="mr-2 h-3 w-3" />
        <p>Invalid payload</p>
      </Badge>
    );
  }
};

type Props = { params: { projectId: string; eventId: string } };
export default async function EventViewPage({
  params: { projectId, eventId },
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
  const event = await db.query.events.findFirst({
    columns: {
      id: true,
      name: true,
      origin: true,
      taskNames: true,
      createdAt: true,
      iv: true,
      payload: true,
      valid: true,
      metadata: true,
    },
    where: (event, { and, eq }) =>
      and(eq(event.id, eventId), eq(event.projectId, projectId)),
  });
  if (!event) notFound();
  const token = await decrypt(org.token, process.env.SECRET_KEY!, org.iv);
  const payload = await decrypt(event.payload, token, event.iv);
  const formattedPayload = formatPayload(payload);
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
              {`${new Date(event.createdAt).toISOString()} (${formatDistanceToNow(event.createdAt, { addSuffix: true })})`}
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
              {formattedPayload}
            </pre>
            <ValidityBadge valid={event.valid} />
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
