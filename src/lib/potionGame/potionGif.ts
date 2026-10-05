"use client";

import { GIFEncoder, applyPalette, quantize } from "gifenc";

/**
 * The animated picture sent in a direct message when a potion is shared:
 * the bottle bobs, its glow breathes, sparkles twinkle, and a drawn
 * "Brew yours" button pulses. Messengers can't make part of a picture
 * tappable, so the real button is the link sent with it.
 *
 * Made in the browser at the moment the potion is brewed (about a second),
 * so it carries the brewer's name and the potion's name in their language.
 * Design approved by Lena 2026-10-06 (sample in the chat).
 */

const W = 360;
const H = 480;
const FRAMES = 20;
const DELAY_MS = 75;
const GOLD = "250,225,163";

export type PotionGifText = {
  /** "Lena brewed you" / "A friend brewed you" */
  from: string;
  /** The potion's name. */
  potion: string;
  /** Label of the drawn button. */
  button: string;
  /** Small line under the button. */
  site: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Shrinks text until it fits the width — potion names differ a lot by language. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, family: string, size: number, maxWidth: number) {
  let s = size;
  ctx.font = `300 ${s}px ${family}`;
  while (s > 12 && ctx.measureText(text).width > maxWidth) {
    s -= 1;
    ctx.font = `300 ${s}px ${family}`;
  }
}

export async function makePotionGif(text: PotionGifText): Promise<Blob> {
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  await document.fonts?.load(`300 28px ${family}`).catch(() => undefined);
  const bottle = await loadImage("/game-art/potion/bottle.png");

  // ---- the parts that never move, drawn once ----
  const base = document.createElement("canvas");
  base.width = W;
  base.height = H;
  const b = base.getContext("2d")!;
  b.fillStyle = "#0b0810";
  b.fillRect(0, 0, W, H);
  const pool = b.createRadialGradient(W / 2, 230, 10, W / 2, 230, 190);
  pool.addColorStop(0, "rgba(110,230,70,0.32)");
  pool.addColorStop(1, "rgba(110,230,70,0)");
  b.fillStyle = pool;
  b.fillRect(0, 0, W, H);
  b.textAlign = "center";
  b.textBaseline = "top";
  fitFont(b, text.from, family, 20, W - 30);
  b.fillStyle = `rgba(${GOLD},0.82)`;
  b.fillText(text.from, W / 2, 22);
  fitFont(b, text.potion, family, 29, W - 24);
  b.fillStyle = `rgb(${GOLD})`;
  b.fillText(text.potion, W / 2, 48);
  const bw = 230;
  const bh = 44;
  const bx = (W - bw) / 2;
  const by = 404;
  b.beginPath();
  b.roundRect(bx, by, bw, bh, 8);
  b.fillStyle = "rgb(52,44,30)";
  b.fill();
  b.strokeStyle = `rgb(${GOLD})`;
  b.lineWidth = 1;
  b.stroke();
  fitFont(b, text.button.toUpperCase(), family, 17, bw - 20);
  b.fillStyle = `rgb(${GOLD})`;
  b.fillText(text.button.toUpperCase(), W / 2, by + 13);
  fitFont(b, text.site, family, 13, W - 30);
  b.fillStyle = `rgba(${GOLD},0.6)`;
  b.fillText(text.site, W / 2, 456);

  // ---- frames ----
  const scale = Math.min(170 / bottle.width, 245 / bottle.height);
  const dw = bottle.width * scale;
  const dh = bottle.height * scale;
  const sparks = Array.from({ length: 10 }, (_, i) => ({
    x: 70 + ((i * 97) % 220),
    y: 105 + ((i * 61) % 275),
    phase: i * 0.9,
    size: 1.5 + (i % 3) * 0.6,
  }));

  const frame = document.createElement("canvas");
  frame.width = W;
  frame.height = H;
  const f = frame.getContext("2d")!;
  const gif = GIFEncoder();
  let palette: ReturnType<typeof quantize> | null = null;

  for (let i = 0; i < FRAMES; i++) {
    const ph = (2 * Math.PI * i) / FRAMES;
    const glow = (Math.sin(ph) + 1) / 2;
    const bob = -7 * Math.sin(ph);
    f.drawImage(base, 0, 0);

    f.save();
    f.shadowColor = `rgba(150,255,90,${0.45 + 0.35 * glow})`;
    f.shadowBlur = 26;
    f.drawImage(bottle, (W - dw) / 2, 118 + bob, dw, dh);
    f.restore();

    for (const s of sparks) {
      const a = Math.max(0, Math.sin(ph * 2 + s.phase));
      if (a < 0.25) continue;
      const r = s.size * a;
      f.fillStyle = f.strokeStyle = `rgba(255,246,200,${a})`;
      f.beginPath();
      f.arc(s.x, s.y, r, 0, Math.PI * 2);
      f.fill();
      f.beginPath();
      f.moveTo(s.x - 3 * r, s.y);
      f.lineTo(s.x + 3 * r, s.y);
      f.moveTo(s.x, s.y - 3 * r);
      f.lineTo(s.x, s.y + 3 * r);
      f.stroke();
    }

    f.beginPath();
    f.roundRect(bx - 2, by - 2, bw + 4, bh + 4, 10);
    f.strokeStyle = `rgba(${GOLD},${0.15 + 0.5 * glow})`;
    f.lineWidth = 2;
    f.stroke();

    const { data } = f.getImageData(0, 0, W, H);
    if (!palette) palette = quantize(data, 160);
    gif.writeFrame(applyPalette(data, palette), W, H, { palette, delay: DELAY_MS, repeat: 0 });
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
}
