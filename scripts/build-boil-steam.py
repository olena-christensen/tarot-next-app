#!/usr/bin/env python3
"""Boil-over art for Brew the Potion (approved by Lena 2026-10-07; replaced the
foam she rejected as "construction foam"):

  steam-wisp-{1..4}.webp  translucent lime ribbons with a brighter rim and a curl,
                          painted to match the room's own green steam
  cauldron-spill.webp     green light running down the pot in see-through
                          streaks, cut to the cauldron's own shape (SPILL_BOX)

Writes to public/game-art/potion/. Run from the repository root:
  python3 scripts/build-boil-steam.py
Needs Pillow and numpy only."""
import math, os, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.join(ROOT, "public", "game-art", "potion")
S = 2
W, H = 220, 520   # sprite size in room pixels

def wisp(seed):
    rnd = random.Random(seed)
    w, h = W * S, H * S
    yy, xx = np.mgrid[0:h, 0:w] / S
    a1, a2 = rnd.uniform(40, 62), rnd.uniform(8, 16)
    f1, f2 = rnd.uniform(1.4, 1.9), rnd.uniform(2.6, 3.4)
    ph = rnd.uniform(0, 6.28)
    # centre line from bottom (t=0) to top (t=1)
    t = 1 - yy / H
    cx = W / 2 + a1 * np.sin(t * math.pi * f1 + ph) + a2 * np.sin(t * math.pi * f2 + ph * 2)
    width = (34 - 22 * t) * (0.6 + 0.4 * np.sin(np.clip(t, 0, 1) * math.pi) ** 0.5) * rnd.uniform(0.85, 1.2)
    d = np.abs(xx - cx) / np.maximum(width, 1)
    body = np.clip(1 - d, 0, 1)
    # the curl at the top: a ring segment
    ccx, ccy, cr = cx[int(0.1 * h), 0], H * 0.1, rnd.uniform(18, 28)
    side = rnd.choice([-1, 1])
    ang = np.arctan2(yy - ccy, (xx - (ccx + side * cr)) * side)
    rr = np.hypot(xx - (ccx + side * cr), yy - ccy)
    ring = np.clip(1 - np.abs(rr - cr) / 8, 0, 1) * (ang < 1.2) * (yy < ccy + 4)
    body = np.where(t > 0.88, np.maximum(body * np.clip((0.97 - t) / 0.09, 0, 1), ring), body)
    # translucent inside, brighter rim (like the painted steam), soft fade at both ends
    rim = np.clip(1 - np.abs(d - 0.82) / 0.18, 0, 1) * (d < 1)
    fade = np.clip(t / 0.25, 0, 1) * np.clip((1.02 - t) / 0.15, 0, 1)
    alpha = (0.5 * body ** 0.5 + 0.5 * rim) * fade
    alpha = np.clip(alpha, 0, 0.85)
    col = np.zeros((h, w, 3))
    inner = np.array([140, 225, 30.]); edge = np.array([220, 255, 120.])
    k = rim[..., None]
    col = inner * (1 - k) + edge * k
    img = np.dstack([col, alpha * 255]).astype("uint8")
    im = Image.fromarray(img, "RGBA").filter(ImageFilter.GaussianBlur(1.2 * S))
    return im.resize((W, H), Image.LANCZOS)

def spill():
    """Green light over the rim and down the pot, only where the pot is."""
    room = np.asarray(Image.open(os.path.join(ROOT, "game-art-source", "room.png")).convert("RGB")).astype(float)
    X0, Y0, X1, Y1 = SPILL_BOX
    lum = room[Y0:Y1, X0:X1].sum(2)
    shape = Image.new("L", (X1 - X0, Y1 - Y0), 0)
    d = ImageDraw.Draw(shape)
    d.ellipse([787 - 178 - X0, 800 - 130 - Y0, 787 + 178 - X0, 800 + 128 - Y0], fill=255)  # belly
    d.ellipse([787 - 176 - X0, 680 - 42 - Y0, 787 + 176 - X0, 680 + 46 - Y0], fill=255)  # rim
    m = (np.asarray(shape) / 255.0) * (lum < 230)  # the dark iron only, not the wood behind
    m = np.asarray(
        Image.fromarray((m * 255).astype("uint8")).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
    ) / 255.0
    yy, xx = np.mgrid[0 : Y1 - Y0, 0 : X1 - X0]
    fade = np.clip(1 - (yy - 40) / 250, 0, 1) ** 1.4
    rng = np.random.default_rng(3)
    streak = np.full(m.shape, 0.35)
    for x in np.linspace(40, 370, 11) + rng.uniform(-12, 12, 11):
        w, length = rng.uniform(7, 13), rng.uniform(110, 250)
        streak += np.exp(-(((xx - x) / w) ** 2)) * np.clip(1 - (yy - 50) / length, 0, 1) * 0.9
    a = np.clip(m * fade * streak * 0.8, 0, 0.8)
    col = np.zeros(a.shape + (3,))
    col[...] = [175, 255, 60]
    im = Image.fromarray(np.dstack([col, a * 255]).astype("uint8"), "RGBA").filter(ImageFilter.GaussianBlur(1.2))
    im.save(os.path.join(OUT, "cauldron-spill.webp"), quality=90, method=6)


SPILL_BOX = (590, 640, 1000, 960)  # room pixels; BrewPotionGame.tsx SPILL_BOX must match

os.makedirs(OUT, exist_ok=True)
for i in range(1, 5):
    wisp(i * 17).save(os.path.join(OUT, f"steam-wisp-{i}.webp"), quality=90, method=6)
spill()
print("4 wisps and the spill written")
