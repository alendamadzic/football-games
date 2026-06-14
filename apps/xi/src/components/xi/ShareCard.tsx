"use client";

import { useRef, useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildShareText, type ShareData } from "@/lib/share";
import { formatTime } from "@/lib/format";

export function ShareCard(data: ShareData) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const text = buildShareText(data);

  async function copy() {
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
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      scale: 2,
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
        className="rounded-xl border bg-card p-5 text-center space-y-3"
      >
        <p className="font-bold text-lg">
          xi<span className="text-primary">.</span> — {data.match.title}
        </p>
        <p className="text-sm text-muted-foreground">
          ⚽ {data.score}/22 &nbsp;|&nbsp; ❤️ {data.lives}/{data.totalLives}{" "}
          &nbsp;|&nbsp; ⏱️ {formatTime(data.seconds)}
        </p>
        <div className="font-mono text-xl leading-relaxed tracking-tight">
          <div>{rowEmoji("home", data)}</div>
          <div>{rowEmoji("away", data)}</div>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <Button onClick={copy} variant="default" className="gap-2">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied!" : "Copy result"}
        </Button>
        <Button onClick={download} variant="outline" className="gap-2">
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
