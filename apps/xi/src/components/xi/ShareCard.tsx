"use client";

import { Button } from "@football/ui/components/button";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { formatTime } from "@/lib/format";
import { buildShareText, type ShareData } from "@/lib/share";

/**
 * The share card is painted in literal hex rather than theme tokens for two
 * reasons: it has to sit on the album's cream paper (the token palette made it
 * render white-on-cream), and html2canvas cannot parse the `oklch()` values
 * every token in globals.css uses — the image export produced a broken card.
 */
const PAPER = "#f6f0e1";
const INK = "#291c11";
const MUTED = "#66503f";
const ACCENT = "#0069a8";

export function ShareCard(data: ShareData) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const text = buildShareText(data);

  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function share() {
    // The native sheet is the expected gesture on a phone; clipboard is the
    // desktop fallback.
    if (canShare) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // Cancelled or unavailable — fall through to the clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — ignore.
    }
  }

  async function download() {
    const el = cardRef.current;
    if (!el) return;
    // Dynamically import so html2canvas is only loaded when needed.
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(el, {
      backgroundColor: PAPER,
      scale: 2,
      // globals.css paints everything in oklch: `border-border` and
      // `outline-ring/50` land on every element, and `bg-background` on the
      // body. html2canvas can't parse the lab()/oklab() those serialise to and
      // throws before drawing a pixel, so neutralise them on the clone.
      onclone: (doc) => {
        for (const node of doc.querySelectorAll<HTMLElement>("*")) {
          node.style.borderColor = "transparent";
          node.style.outlineColor = "transparent";
          node.style.textDecorationColor = "currentcolor";
        }
        for (const root of [doc.documentElement, doc.body]) {
          root.style.backgroundColor = PAPER;
        }
        // Put the card's own border back after the blanket reset.
        const card = doc.querySelector<HTMLElement>("[data-share-card]");
        if (card) card.style.borderColor = INK;
      },
    });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "xi-result.png";
    a.click();
  }

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        data-share-card
        className="space-y-3 rounded-xl border-2 p-5 text-center"
        style={{ backgroundColor: PAPER, borderColor: INK, color: INK }}
      >
        <p className="text-lg font-bold">
          xi<span style={{ color: ACCENT }}>.</span> — {data.match.title}
        </p>
        <p className="text-sm" style={{ color: MUTED }}>
          ⚽ {data.score}/22 &nbsp;|&nbsp; ❤️ {data.lives}/{data.totalLives}{" "}
          &nbsp;|&nbsp; ⏱️ {formatTime(data.seconds)}
        </p>
        <div className="font-mono text-lg leading-relaxed tracking-tight sm:text-xl">
          <div>{rowEmoji("home", data)}</div>
          <div>{rowEmoji("away", data)}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button onClick={share} variant="default" className="h-11 gap-2">
          {copied ? (
            <Check className="size-4" />
          ) : canShare ? (
            <Share2 className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          {copied ? "Copied!" : canShare ? "Share result" : "Copy result"}
        </Button>
        <Button onClick={download} variant="outline" className="h-11 gap-2">
          <Download className="size-4" /> Image
        </Button>
      </div>
    </div>
  );
}

function rowEmoji(team: "home" | "away", data: ShareData): string {
  const count =
    team === "home"
      ? data.match.homePlayers.length
      : data.match.awayPlayers.length;
  let row = "";
  for (let i = 0; i < count; i++) {
    row += data.guessed.has(`${team}-${i}`) ? "🟩" : "🟥";
  }
  return row;
}
