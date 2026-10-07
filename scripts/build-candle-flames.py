#!/usr/bin/env python3
"""Flickering candle flames for Brew the Potion (Lena, 2026-10-07).

For each candle in the room it writes two transparent pictures to
public/game-art/potion/:
  candle-cover-<n>.webp  the glow behind the flame with the flame painted out
                         (sits still over the room, so the painted flame never
                         shows twice while the live one moves)
  candle-flame-<n>.webp  the flame itself, which the game sways and stretches
The game places both at the boxes in CANDLES (BrewPotionGame.tsx CANDLES).
Run from the repository root:  python3 scripts/build-candle-flames.py
Needs Pillow and numpy only."""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.join(ROOT, "public", "game-art", "potion")
# flame centre x, flame tip y, wick base y (room pixels)
CANDLES = [(830, 206, 250), (439, 448, 494), (493, 514, 542), (1330, 562, 594), (140, 778, 822)]
PAD = 10

room = Image.open(os.path.join(ROOT, "game-art-source", "room.png")).convert("RGB")
os.makedirs(OUT, exist_ok=True)
boxes = []
for n, (cx, top, base) in enumerate(CANDLES, 1):
    h = base - top
    w = int(h * 0.62)
    x0, y0, x1, y1 = cx - w // 2 - PAD, top - PAD, cx + w // 2 + PAD, base + 2
    crop = np.asarray(room.crop((x0, y0, x1, y1))).astype(float)
    R, G, B = crop[..., 0], crop[..., 1], crop[..., 2]
    # the flame: bright warm pixels, plus its dark outline right around them
    core = ((R > 215) & (G > 130) & (R - B > 40)).astype(float)
    core[-6:, :] = 0  # leave the wax top alone
    m = np.asarray(Image.fromarray((core * 255).astype("uint8")).filter(ImageFilter.MaxFilter(5))) / 255.0
    soft = np.asarray(Image.fromarray((m * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.6))) / 255.0
    # cover: fill the flame area from its surroundings (repeated blur-fill)
    hole = m > 0.01
    fill = crop.copy()
    ring = np.asarray(Image.fromarray((hole * 255).astype("uint8")).filter(ImageFilter.MaxFilter(7))) > 0
    fill[hole] = crop[ring & ~hole].mean(axis=0)
    for _ in range(80):
        blurred = np.asarray(Image.fromarray(fill.astype("uint8")).filter(ImageFilter.GaussianBlur(1.5))).astype(float)
        fill[hole] = blurred[hole]
    cover = np.dstack([fill, soft * 255]).clip(0, 255).astype("uint8")
    flame = np.dstack([crop, soft * 255]).clip(0, 255).astype("uint8")
    Image.fromarray(cover, "RGBA").save(os.path.join(OUT, f"candle-cover-{n}.webp"), quality=92, method=6)
    Image.fromarray(flame, "RGBA").save(os.path.join(OUT, f"candle-flame-{n}.webp"), quality=92, method=6)
    boxes.append((x0, y0, x1 - x0, y1 - y0))
print("CANDLES =", boxes)
