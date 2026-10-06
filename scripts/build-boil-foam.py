#!/usr/bin/env python3
"""Boil-over foam for Brew the Potion, painted as one gooey mass (not
separate balls): a metaball field gives the shape, its slope gives the light.
Writes two transparent layers: heap (above the rim) and drips (down the pot)
to public/game-art/potion/foam-{heap,drips}.webp. The game places both at the
world box printed at the end (BrewPotionGame.tsx, FOAM_BOX).

Run from the repository root:  python3 scripts/build-boil-foam.py
Needs Pillow and numpy only. Approved by Lena 2026-10-06."""
import math, random
import os
import sys
import numpy as np
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.join(ROOT, "public", "game-art", "potion")


def blur(a, sigma):
    """Gaussian blur of a float array (numpy only, like the other art script)."""
    r = int(sigma * 3) + 1
    k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * sigma * sigma)); k /= k.sum()
    a = np.apply_along_axis(lambda v: np.convolve(np.pad(v, r, mode="edge"), k, "valid"), 0, a)
    return np.apply_along_axis(lambda v: np.convolve(np.pad(v, r, mode="edge"), k, "valid"), 1, a)

random.seed(11)
S = 2
X0, Y0, X1, Y1 = 560, 520, 1010, 940
W, H = (X1 - X0) * S, (Y1 - Y0) * S
RCX, RCY, RRX, RRY = 787, 680, 172, 40
yy, xx = np.mgrid[0:H, 0:W]
WX, WY = xx / S + X0, yy / S + Y0

def blob(F, cx, cy, rx, ry=None):
    ry = ry or rx
    F += np.exp(-(((WX - cx) / rx) ** 2 + ((WY - cy) / ry) ** 2) * 2.2)

def build(F, thr=0.5):
    m = F - thr
    h = np.clip(m, 0, None) ** 0.5            # rounded profile
    h = blur(h, 1.2 * S)
    gy, gx = np.gradient(h * 60)
    n = np.dstack([-gx, -gy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    alpha = np.clip(m * 12 * S, 0, 1)
    return n, h, alpha

L = np.array([-0.45, -0.7, 0.55]); L /= np.linalg.norm(L)
Hv = L + np.array([0, 0, 1.]); Hv /= np.linalg.norm(Hv)
LIT, MID, DARK, DEEP = map(np.array, ([232, 255, 96.], [128, 204, 24.], [44, 112, 10.], [18, 48, 6.]))

def paint(n, h, alpha, fade_from=None):
    d = np.clip((n * L).sum(2), 0, 1)
    t = d[..., None]
    c = DARK * (1 - t) ** 2 + MID * 2 * t * (1 - t) + LIT * t ** 2
    # thin edges and the underside go deep green — gives weight
    thin = np.clip(1 - h / 0.35, 0, 1)[..., None]
    under = np.clip((n[..., 1:2]) * 1.6, 0, 1)
    c = c * (1 - 0.55 * under) + DEEP * 0.55 * under
    # the potion glows from inside: lime light where it's thin
    c = c + np.array([90, 110, 0.]) * thin * 0.45
    # glossy wet highlights (sharp) and a soft sheen
    sp = np.clip((n * Hv).sum(2), 0, 1)
    c = c + 255 * (0.85 * sp ** 120 + 0.12 * sp ** 8)[..., None]
    # painted outline: a soft dark-green edge, never black
    edge = np.clip(1 - np.abs(alpha - 0.5) * 2, 0, 1)
    edge = blur(edge, 0.8 * S)[..., None]
    c = c * (1 - 0.6 * edge) + DEEP * 0.6 * edge
    return np.clip(c, 0, 255)

# ---------- heap ----------
F = np.zeros((H, W))
for i in range(70):
    a = random.uniform(0, 2 * math.pi); rr = math.sqrt(random.random())
    x = RCX + RRX * 0.97 * rr * math.cos(a)
    y = RCY + RRY * rr * math.sin(a)
    dome = (1 - rr ** 2) ** 0.5
    y -= dome * random.uniform(18, 60) + 6
    r = random.choice([random.uniform(10, 18), random.uniform(16, 28), random.uniform(26, 36)])
    blob(F, x, y, r * 1.15, r)
# the front lip: potion pouring over the rim edge
for i in range(0, 181, 4):
    a = math.radians(i)
    blob(F, RCX - RRX * math.cos(a) * 1.02, RCY + RRY * math.sin(a) * 1.08, 15, 13)
n, h, al = build(F)
heap_c = paint(n, h, al)
heap_a = al
# boiling bubbles on the surface: shiny domes, a few with a see-through skin
def sphere_on(c, a, cx, cy, r, skin=False):
    nx = (WX - cx) / r; ny = (WY - cy) / r
    rr = nx ** 2 + ny ** 2
    inside = rr < 1
    nz = np.sqrt(np.clip(1 - rr, 0, 1))
    nn = np.dstack([nx, ny, nz])
    col = paint(nn, np.full_like(rr, 0.6), np.ones_like(rr))
    edge = np.clip((1 - rr) * r * S / 1.2, 0, 1)
    if skin:
        k = np.clip((rr - 0.6) / 0.4, 0, 1) * 0.75 + 0.15
        sp = np.clip((nn * Hv).sum(2), 0, 1) ** 60
        k = np.maximum(k, sp)
    else:
        k = np.ones_like(rr)
    w = (inside * edge * k)[..., None]
    c[:] = c * (1 - w) + col * w
    a[:] = np.maximum(a, (inside * edge * k))
random.seed(5)
for i in range(26):
    ang = random.uniform(0, 2 * math.pi); rr = math.sqrt(random.random()) * 0.92
    x = RCX + RRX * rr * math.cos(ang)
    y = RCY + RRY * rr * math.sin(ang) - (1 - rr ** 2) ** 0.5 * random.uniform(40, 66) - 6
    if heap_a[int((y - Y0) * S), int((x - X0) * S)] < 0.5:
        continue
    sphere_on(heap_c, heap_a, x, y, random.uniform(5, 13), skin=random.random() < 0.5)

# ---------- drips (also a metaball field, so they flow out of the lip) ----------
D = np.zeros((H, W))
for i in range(0, 181, 4):
    a = math.radians(i)
    blob(D, RCX - RRX * math.cos(a) * 1.02, RCY + RRY * math.sin(a) * 1.08 + 4, 14, 12)
for x, ln, w in [(642, 54, 15), (694, 118, 19), (742, 70, 14), (774, 160, 22), (826, 84, 16),
                 (872, 136, 20), (928, 66, 15)]:
    a = math.acos(max(-1, min(1, (RCX - x) / RRX)))
    y0 = RCY + RRY * math.sin(a) + 6
    wob = random.uniform(0, 6)
    steps = int(ln / 3)
    for k in range(steps + 1):
        t = k / steps
        r = w * (1.25 - 0.7 * t ** 0.7)
        blob(D, x + math.sin(t * 2.2 + wob) * 3, y0 + ln * t, r * 0.62, r * 0.75)
    blob(D, x + math.sin(2.2 + wob) * 3, y0 + ln + w * 0.35, w * 0.62, w * 0.72)  # the drop
n, h, al = build(D)
drip_c = paint(n, h, al)
drip_a = al

def save(c, a, name):
    img = np.dstack([c, a * 255]).clip(0, 255).astype("uint8")
    im = Image.fromarray(img, "RGBA").resize((X1 - X0, Y1 - Y0), Image.LANCZOS)
    im.save(os.path.join(OUT, name), quality=90, method=6)


os.makedirs(OUT, exist_ok=True)
save(heap_c, heap_a, "foam-heap.webp")
save(drip_c, drip_a, "foam-drips.webp")
print("foam layers: world box", X0, Y0, X1 - X0, Y1 - Y0)
