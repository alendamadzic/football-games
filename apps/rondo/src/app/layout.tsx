import type { Metadata, Viewport } from "next";
import { Anton, Geist_Mono, Oxanium } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@football/shared/convex-provider";
import { cn } from "@football/ui/lib/utils";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { Toaster } from "@/components/ui/sonner";

// Oxanium drives the UI; Anton is the heavy condensed wordmark/display face;
// Geist Mono powers timers and scores.
const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-sans" });

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "rondo. — the football chain game",
  description:
    "Club → Player → Club → Player. Build the longest football knowledge chain. Local multiplayer and solo Arcade mode.",
  applicationName: "rondo.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f2" },
    { media: "(prefers-color-scheme: dark)", color: "#101a14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        oxanium.variable,
        anton.variable,
        geistMono.variable,
      )}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
