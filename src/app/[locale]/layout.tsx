import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { IntlayerClientProvider } from "next-intlayer";
import type { LocalesValues } from "intlayer";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SpoolIQ",
    template: "%s · SpoolIQ",
  },
  description: "Smart filament management for makers who mean business.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased bg-background text-foreground"
        suppressHydrationWarning
      >
        <IntlayerClientProvider locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="spooliq-theme"
          >
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
        </IntlayerClientProvider>

        <SpeedInsights />
        <Toaster />
      </body>
    </html>
  );
}
