import type { ReactNode } from "react";
import { Navbar } from "./_components/navbar";
import { Container } from "@/components/design/container";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex flex-col items-center justify-start">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
