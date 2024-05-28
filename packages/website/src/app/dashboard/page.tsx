import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default function Page() {
  const { orgId, userId } = auth();
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-24 pt-0">
      <div className="flex w-screen flex-row items-center justify-between px-4 pb-24">
        do-it-plz
        <div className="flex h-full flex-row items-center justify-center gap-x-8">
          <OrganizationSwitcher />
          <UserButton />
        </div>
      </div>
      <p>User Id: {userId}</p>
      <p>Org ID: {orgId}</p>
    </main>
  );
}
