import { Container } from "@/components/design/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db/parent";
import { decrypt } from "@/utils/crypto";
import { notFound } from "next/navigation";
// import { Clipboard } from "lucide-react";

type Props = { params: { projectId: string } };
export default async function Settings({ params: { projectId } }: Props) {
  console.log({ projectId });
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
  const token = await decrypt(org.token, process.env.SECRET_KEY!, org.iv);
  return (
    <Container>
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
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Public ID</p>
              <div className="text-muted-foreground text-md flex flex-row space-x-4">
                <p>{org.publicId}</p>
                {/* <Clipboard /> */}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Token (secret)</p>
              <div className="text-muted-foreground text-md flex flex-row space-x-4">
                {token}
                {/* <p>Project token: 🙈🙈🙈🙈🙈🙈🙈</p> */}
                {/* <Clipboard /> */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
