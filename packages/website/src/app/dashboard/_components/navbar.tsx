"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const pathname = usePathname();
  return (
    <header className="bg-background sticky top-0 flex h-16 items-center gap-4 border-b px-4 md:px-6">
      <nav className="hidden w-full flex-col text-lg font-medium md:flex md:flex-row md:items-center md:justify-between md:gap-5 md:text-sm lg:gap-6">
        <div className="hover:text-foreground flex flex-row items-center justify-start gap-6 transition-colors">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 pr-4 text-lg font-semibold md:text-base"
          >
            do-it-plz
          </Link>
          {projectId && (
            <>
              <Link
                href={`/dashboard/${projectId}`}
                className={
                  pathname === `/dashboard/${projectId}`
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                Dashboard
              </Link>
              <Link
                href={`/dashboard/${projectId}/events`}
                className={
                  pathname === `/dashboard/${projectId}/events`
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                Events
              </Link>
              <Link
                href={`/dashboard/${projectId}/tasks`}
                className={
                  pathname === `/dashboard/${projectId}/tasks`
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                Tasks
              </Link>
              <Link
                href={`/dashboard/${projectId}/settings`}
                className={
                  pathname === `/dashboard/${projectId}/settings`
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                Settings
              </Link>
            </>
          )}
        </div>
        <div className="flex h-12 flex-row items-center justify-center gap-x-8">
          <OrganizationSwitcher
            afterSelectOrganizationUrl={({ id }) => `/dashboard/switcher/${id}`}
            afterSelectPersonalUrl={({ id }) => `/dashboard/switcher/${id}`}
          />
          <UserButton />
        </div>
      </nav>
      <div className="flex w-full flex-row items-center justify-between">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="flex h-full flex-col justify-between gap-6 text-lg font-medium">
              <div className="flex flex-col gap-6">
                <Link
                  href={`/dashboard/${projectId}`}
                  className={
                    pathname === `/dashboard/${projectId}`
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  Dashboard
                </Link>
                <Link
                  href={`/dashboard/${projectId}/events`}
                  className={
                    pathname === `/dashboard/${projectId}/events`
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  Events
                </Link>
                <Link
                  href={`/dashboard/${projectId}/tasks`}
                  className={
                    pathname === `/dashboard/${projectId}/tasks`
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  Tasks
                </Link>
                <Link
                  href={`/dashboard/${projectId}/settings`}
                  className={
                    pathname === `/dashboard/${projectId}/settings`
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  Settings
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex">
          <OrganizationSwitcher
            afterSelectOrganizationUrl={({ id }) => `/dashboard/switcher/${id}`}
            afterSelectPersonalUrl={({ id }) => `/dashboard/switcher/${id}`}
          />
          <UserButton />
        </div>
      </div>
    </header>
  );
};
