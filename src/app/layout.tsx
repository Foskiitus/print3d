import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Print3D Manager",
  description: "Gerenciamento de negócio de impressão 3D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" className="dark">
      <body suppressHydrationWarning>
        <SessionProvider>
          {children}
          <SpeedInsights />
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
