import { Container } from "@/components/design/container";
import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";
import { Navbar } from "./_components/navbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex flex-col items-center justify-start">
        <Container>{children}</Container>
      </main>
      <Toaster richColors />
    </div>
  );
}
