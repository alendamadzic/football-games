import type { Metadata, Viewport } from "next";
import { Anton, Manrope } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ConvexClientProvider } from "@football/shared/convex-provider";
import { cn } from "@football/ui/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";

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

// Mobile essentials: opt into the safe-area env() vars behind the notch and
// home indicator, and ask the browser to resize the layout when the software
// keyboard opens (honoured by Chrome/Android; iOS Safari is handled by
// useVisualViewport instead).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
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
