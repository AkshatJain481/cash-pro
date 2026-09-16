import type { Metadata, Viewport } from "next";
import { DM_Mono, Space_Grotesk } from "next/font/google";

import { AppToaster } from "@/components/app-toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

import "./globals.css";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Cash Pro",
  description: "Receipts & payments, calendar, tasks, to-dos and net worth in one place.",
};

export const viewport: Viewport = {
  themeColor: "#1a3a2a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(sans.variable, mono.variable, "antialiased")}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
