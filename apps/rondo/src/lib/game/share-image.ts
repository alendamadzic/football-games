import { getNationEntry, getPositionEntry } from "./difficulty";
import type { GameConfig, GameState } from "./types";

// Brand colours (fixed dark palette regardless of user theme)
const C = {
  bg: "#0d1810",
  surface: "#162012",
  volt: "#c8f135",
  voltDim: "#8ab52a",
  white: "#f0f5ec",
  muted: "#7a9080",
  border: "rgba(255,255,255,0.08)",
} as const;

const W = 1080;
const H = 1080;
const PAD = 72;

function timerLabel(turnSeconds: GameConfig["turnSeconds"], isArcade: boolean): string {
  if (turnSeconds === "dynamic") return "Dynamic timer";
  if (turnSeconds === null) return "No timer";
  const val = turnSeconds < 60 ? `${turnSeconds}s` : `${turnSeconds / 60}m`;
  return `${val} ${isArcade ? "session" : "per turn"}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  label: string,
  sublabel: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = C.surface;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // main label
  ctx.fillStyle = C.volt;
  ctx.font = `400 32px "Anton", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + h / 2 - 4);

  // sublabel
  ctx.fillStyle = C.muted;
  ctx.font = `600 13px "Oxanium", sans-serif`;
  ctx.fillText(sublabel.toUpperCase(), x + w / 2, y + h / 2 + 20);
}

export async function generateShareImage(state: GameState): Promise<Blob> {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle pitch-line texture (diagonal grid)
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // Volt accent bar — left edge
  ctx.fillStyle = C.volt;
  ctx.fillRect(0, 0, 10, H);

  // ── Wordmark ─────────────────────────────────────────────────────────────
  const markY = PAD + 48;
  ctx.font = `400 64px "Anton", sans-serif`;
  ctx.textAlign = "left";
  ctx.fillStyle = C.white;
  const rondoText = "rondo";
  ctx.fillText(rondoText, PAD + 20, markY);
  const rondoW = ctx.measureText(rondoText).width;
  ctx.fillStyle = C.volt;
  ctx.fillText(".", PAD + 20 + rondoW, markY);

  // Mode pill (top right)
  const isArcade = state.mode === "arcade";
  const modeLabel = isArcade ? "ARCADE" : "LOCAL";
  ctx.font = `700 22px "Oxanium", sans-serif`;
  const modeW = ctx.measureText(modeLabel).width + 36;
  const modeX = W - PAD - 20 - modeW;
  const modeY = markY - 40;
  ctx.fillStyle = C.volt;
  roundRect(ctx, modeX, modeY, modeW, 40, 8);
  ctx.fill();
  ctx.fillStyle = "#0d1810";
  ctx.textAlign = "center";
  ctx.fillText(modeLabel, modeX + modeW / 2, modeY + 27);

  // ── Divider ───────────────────────────────────────────────────────────────
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD + 20, markY + 28);
  ctx.lineTo(W - PAD - 20, markY + 28);
  ctx.stroke();

  // ── Hero: score or winner ─────────────────────────────────────────────────
  const heroY = markY + 28 + 60;

  if (isArcade) {
    // Subheading
    ctx.font = `700 22px "Oxanium", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = C.muted;
    const arcadeReason = state.lastElimination?.reason;
    const reasonLabel =
      arcadeReason === "timeout"
        ? "TIME'S UP"
        : arcadeReason === "gaveup"
          ? "RUN ENDED"
          : "WRONG LINK";
    ctx.fillText(reasonLabel, PAD + 20, heroY);

    // Score number
    ctx.font = `400 240px "Anton", sans-serif`;
    ctx.fillStyle = C.volt;
    ctx.textAlign = "left";
    ctx.fillText(String(state.score), PAD + 20, heroY + 230);

    // "links" label
    ctx.font = `400 64px "Anton", sans-serif`;
    ctx.fillStyle = C.white;
    ctx.fillText("LINKS BUILT", PAD + 20, heroY + 310);
  } else {
    const winner = state.players.find((p) => p.id === state.winnerId);
    const links = state.chain.length - 1;

    ctx.font = `700 22px "Oxanium", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = C.muted;
    ctx.fillText("WINNER", PAD + 20, heroY);

    ctx.font = `400 140px "Anton", sans-serif`;
    ctx.fillStyle = C.volt;
    // Clamp long names
    const winnerName = (winner?.name ?? "Nobody").toUpperCase();
    let fontSize = 140;
    ctx.font = `400 ${fontSize}px "Anton", sans-serif`;
    while (ctx.measureText(winnerName).width > W - PAD * 2 - 40 && fontSize > 60) {
      fontSize -= 4;
      ctx.font = `400 ${fontSize}px "Anton", sans-serif`;
    }
    ctx.fillText(winnerName, PAD + 20, heroY + fontSize + 10);

    ctx.font = `400 52px "Anton", sans-serif`;
    ctx.fillStyle = C.white;
    ctx.fillText(
      `${links}-LINK CHAIN`,
      PAD + 20,
      heroY + fontSize + 10 + 68,
    );
  }

  // ── Settings chips ────────────────────────────────────────────────────────
  const { turnSeconds, restrictions } = state.config;
  const nation = restrictions.nationality ? getNationEntry(restrictions.nationality) : null;
  const pos = restrictions.position ? getPositionEntry(restrictions.position) : null;

  const chips: Array<{ label: string; sub: string }> = [];
  chips.push({ label: timerLabel(turnSeconds, isArcade).split(" ")[0], sub: timerLabel(turnSeconds, isArcade).split(" ").slice(1).join(" ") || "timer" });

  if (nation) chips.push({ label: nation.flag, sub: `${nation.nationality} only` });
  if (pos) chips.push({ label: pos.abbr, sub: `${pos.position}s only` });
  if (!nation && !pos) chips.push({ label: "—", sub: "No restrictions" });

  const chipH = 88;
  const chipGap = 16;
  const chipW = Math.min(220, (W - PAD * 2 - 20 - chipGap * (chips.length - 1)) / chips.length);
  const chipsY = H - PAD - 88 - chipH - 20;

  chips.forEach((chip, i) => {
    drawChip(
      ctx,
      chip.label,
      chip.sub,
      PAD + 20 + i * (chipW + chipGap),
      chipsY,
      chipW,
      chipH,
    );
  });

  // ── URL / CTA ─────────────────────────────────────────────────────────────
  const urlY = H - PAD - 20;
  ctx.font = `600 28px "Oxanium", sans-serif`;
  ctx.textAlign = "left";
  ctx.fillStyle = C.muted;
  ctx.fillText("Think you can beat it?", PAD + 20, urlY - 36);
  ctx.fillStyle = C.volt;
  ctx.font = `700 28px "Oxanium", sans-serif`;
  ctx.fillText("rondo.alen.world", PAD + 20, urlY);

  // Right side CTA arrow decoration
  ctx.font = `400 48px "Anton", sans-serif`;
  ctx.textAlign = "right";
  ctx.fillStyle = C.voltDim;
  ctx.fillText("→", W - PAD - 20, urlY);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas.toBlob failed"))),
      "image/png",
    );
  });
}
