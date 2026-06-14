import type { Metadata } from "next";
import { Manrope, Anton } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
// Condensed sports-poster display face used across the design candidates.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "xi. — the daily football XI game",
  description:
    "Every day a famous football match is revealed. Guess the starting XI for both teams before you run out of lives.",
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
        "h-full",
        "antialiased",
        "font-sans",
        manrope.variable,
        anton.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Suspense>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
