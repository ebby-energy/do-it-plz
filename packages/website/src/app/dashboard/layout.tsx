import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start">
      <div className="flex w-screen flex-row items-center justify-between px-4">
        <Link href="/dashboard">do-it-plz</Link>
        <div className="flex h-12 flex-row items-center justify-center gap-x-8">
          <OrganizationSwitcher />
          <UserButton />
        </div>
      </div>
      {children}
    </main>
  );
}
