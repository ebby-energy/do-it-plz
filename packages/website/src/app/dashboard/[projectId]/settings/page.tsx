import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db/parent";
import { decrypt } from "@/utils/crypto";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ClipboardCopy } from "./_components/clipboard-copy";
import { SecretToken } from "./_components/secret-token";

type Props = { params: { projectId: string } };
export default async function Settings({ params: { projectId } }: Props) {
  const { orgId } = auth();
  const org = await db.query.organizations.findFirst({
    columns: {
      id: true,
      name: true,
      publicId: true,
      token: true,
      iv: true,
      createdAt: true,
    },
    where: (org, { eq }) => eq(org.publicId, projectId),
  });
  if (!org) notFound();
  if (org.id !== orgId) notFound();
  const token = await decrypt(org.token, process.env.SECRET_KEY!, org.iv);
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-start gap-y-12">
      <h1 className="text-4xl font-bold">Settings</h1>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Name</p>
            <p className="text-muted-foreground text-md">{org.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Created</p>
            <p className="text-muted-foreground text-md">
              {new Date(org.createdAt).toUTCString()}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-medium leading-none">
              Copy all variables for .env files
            </p>
            <div className="text-muted-foreground text-md flex flex-row flex-wrap items-center">
              <ClipboardCopy
                text={`\n# do-it-plz\nDIP_CLIENT_ID=${org.publicId}\nDIP_TOKEN=${token}\n`}
                successMessage="Copied all environment variables to clipboard"
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">DIP_CLIENT_ID</p>
              <div className="text-muted-foreground text-md flex flex-row flex-wrap items-center justify-between gap-y-2">
                <p>{org.publicId}</p>
                <ClipboardCopy
                  text={org.publicId}
                  successMessage="Copied client ID to clipboard"
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex flex-row items-center justify-start gap-4">
                <p className="text-sm font-medium leading-none">DIP_TOKEN</p>
                <Badge variant="outline">secret</Badge>
              </div>
              <div className="text-muted-foreground text-md flex flex-row flex-wrap items-center justify-between gap-y-2 break-words">
                <SecretToken text={token} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
