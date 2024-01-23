import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.png";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Image src={logo} alt="do-it-plz logo" />
      <h1 className="text-4xl font-bold text-center">do-it-plz</h1>
      <Button size="lg" variant="default" asChild>
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </main>
  );
}
