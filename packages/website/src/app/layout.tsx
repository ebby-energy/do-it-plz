import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import { AxiomWebVitals } from "next-axiom";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";

export const runtime = "edge";

const atkinson = Atkinson_Hyperlegible({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://do-it-plz.com"),
  title: "do-it-plz - Managed Task Runner for Serverless Applications",
  description:
    "TypeScript-friendly managed task runner for serverless apps. Ensure runtime safety with strong typing and seamless integration. Run long-running tasks in your app, not ours.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        <body className={atkinson.className}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            {children}
          </ThemeProvider>
          <AxiomWebVitals />
        </body>
      </html>
    </ClerkProvider>
  );
}
