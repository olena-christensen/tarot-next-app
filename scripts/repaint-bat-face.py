#!/usr/bin/env python3
"""
One-off: repaints the hanging bat's face in the room picture (Lena, 2026-10-06).
Old details wiped, big amber eyes, two vampire fangs. She hangs upside down,
so the face is upside down too: fangs above the eyes, pointing up.

Run once from the repository root:
  python3 scripts/repaint-bat-face.py game-art-source/room-original.png game-art-source/room.png
then python3 scripts/build-potion-art.py
"""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
room = Image.open(src).convert("RGBA")
CX, CY, RX, RY = 971, 248, 25, 22
S = 8  # draw at 8x then shrink, for smooth edges
x0, y0, x1, y1 = CX - 45, CY - 40, CX + 45, CY + 40
crop = room.crop((x0, y0, x1, y1))
W, H = crop.size
# 1. wipe the old features: the face's own colours, heavily blurred
m = Image.new("L", (W * S, H * S), 0)
ImageDraw.Draw(m).ellipse([(CX - RX - x0) * S, (CY - RY - y0) * S, (CX + RX - x0) * S, (CY + RY - y0) * S], fill=255)
m = m.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
# the head's own plum colour (sampled from its fur), lit softly from above-left
yy, xx = np.mgrid[0:H, 0:W]
d2 = ((xx - (CX - 8 - x0)) / (RX * 1.4)) ** 2 + ((yy - (CY - 10 - y0)) / (RY * 1.4)) ** 2
light = (1.25 - 0.45 * np.clip(d2, 0, 1))[..., None]
sm = (np.array([66, 48, 76], float)[None, None] * light).clip(0, 255).astype("uint8")
crop.paste(Image.fromarray(sm), (0, 0), m)
# 2. features, drawn big then shrunk
big = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
d = ImageDraw.Draw(big)
P = lambda x, y: ((x - x0) * S, (y - y0) * S)
OUT = (28, 14, 30, 255)
def eye(ex, ey):
    r = 8.5
    d.ellipse([*P(ex - r - 1.3, ey - r - 1.3), *P(ex + r + 1.3, ey + r + 1.3)], fill=OUT)
    d.ellipse([*P(ex - r, ey - r), *P(ex + r, ey + r)], fill=(255, 196, 40, 255))
    d.ellipse([*P(ex - r * .62, ey - r * .62), *P(ex + r * .62, ey + r * .62)], fill=(232, 90, 20, 255))
    d.ellipse([*P(ex - 2.2, ey - 6), *P(ex + 2.2, ey + 6)], fill=OUT)            # slit pupil
eye(959, 244)
eye(983, 244)
# mouth: a small smile line, and two fangs hanging from it
d.line([*P(964, 259), *P(971, 261), *P(978, 259)], fill=OUT, width=int(1.6 * S), joint="curve")
for fx in (966.5, 975.5):
    tri = [P(fx - 3, 259.6), P(fx + 3, 259.6), P(fx, 268)]
    d.polygon(tri, fill=OUT)
    tri2 = [P(fx - 2.1, 260.3), P(fx + 2.1, 260.3), P(fx, 266.6)]
    d.polygon(tri2, fill=(250, 246, 235, 255))
# She hangs upside down, so her face is upside down too: mouth and fangs
# above the eyes, fangs pointing up (Lena, 2026-10-06).
big = big.rotate(180, center=P(CX, CY), resample=Image.BICUBIC)
# Shine on the eyes stays top-left: the light in the room comes from above.
d = ImageDraw.Draw(big)
for ex in (959, 983):
    ey = 2 * CY - 244
    d.ellipse([*P(ex - 5.5, ey - 6.5), *P(ex - 2, ey - 3)], fill=(255, 250, 225, 255))
crop.alpha_composite(big.resize((W, H), Image.LANCZOS))
room.paste(crop, (x0, y0))
room.save(dst)
