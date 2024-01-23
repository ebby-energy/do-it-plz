import { OrganizationSwitcher, UserButton, auth } from "@clerk/nextjs";

export default function Page() {
  const { orgId, userId } = auth();
  return (
    <main className="flex min-h-screen flex-col items-center justify-start pt-0 p-24">
      <div className="flex flex-row w-screen items-center justify-between px-4 pb-24">
        do-it-plz
        <div className="flex h-full gap-x-8 flex-row items-center justify-center">
          <OrganizationSwitcher />
          <UserButton />
        </div>
      </div>
      <p>User Id: {userId}</p>
      <p>Org ID: {orgId}</p>
    </main>
  );
}
