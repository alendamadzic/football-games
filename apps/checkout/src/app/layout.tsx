import type { Metadata } from "next";
import {
  Anton,
  Geist_Mono,
  Permanent_Marker,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { cn } from "@football/ui/lib/utils";
import { ConvexClientProvider } from "@/components/convex-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marker",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "checkout.",
  description:
    "Football's 501. Name players, tick the score down, land on exactly zero.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        spaceGrotesk.variable,
        anton.variable,
        permanentMarker.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
