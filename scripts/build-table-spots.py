"""Flat outlines for the spots on the castle table (Lena, 2026-10-14).

When an item is being placed, spots on the table are drawn as shapes lying on
the table top in perspective, like the plates, instead of upright boxes. This
uses the same table geometry as scripts/build-castle-art.py (TABLE, TABLE_LEN,
SEATS_V, PLATE_W, CENTRE_PIECE, TREATS for both rooms) — keep them in step.

Writes src/lib/castleGame/table-spots.generated.json:
  { "wide": { place: [[x, y], ...] | [[[x, y], ...], ...] }, "phone": {...} }
Each place is a list of polygons in room pixels.
"""
import json, math
import numpy as np

ROOMS = {
    "wide": dict(
        TABLE=[(662, 508), (920, 508), (1162, 742), (420, 742)], TABLE_LEN=1.45,
        SEATS_V=[1.20, 0.75, 0.30], PLATE_W=0.40, CENTRE=(0.50, 1.20),
        TREATS={"treatFront": (0.50, 0.30, 0.22), "treatMiddle": (0.50, 0.75, 0.22)},
    ),
    "phone": dict(
        TABLE=[(343, 1312), (594, 1312), (858, 1621), (79, 1621)], TABLE_LEN=3.65,
        SEATS_V=[1.93, 1.12, 0.32], PLATE_W=0.34, CENTRE=(0.50, 1.93),
        TREATS={"treatFront": (0.50, 0.32, 0.22), "treatMiddle": (0.50, 1.12, 0.22)},
    ),
}


def homography(src, dst):
    A = []
    for (x, y), (u, v) in zip(src, dst):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y, -u])
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y, -v])
    _, _, vt = np.linalg.svd(np.array(A, float))
    Hm = vt[-1].reshape(3, 3)
    return Hm / Hm[2, 2]


def spots(r):
    L = r["TABLE_LEN"]
    H = homography([(0, 0), (1, 0), (1, L), (0, L)], [r["TABLE"][3], r["TABLE"][2], r["TABLE"][1], r["TABLE"][0]])

    def at(u, v):
        p = H @ np.array([u, v, 1.0])
        return [round(p[0] / p[2], 1), round(p[1] / p[2], 1)]

    def disc(u, v, ru, rv=None, n=36):
        rv = ru if rv is None else rv
        return [at(u + ru * math.cos(2 * math.pi * i / n), v + rv * math.sin(2 * math.pi * i / n)) for i in range(n)]

    out = {}
    m = 0.03  # a little inside the table's edge
    out["cloth"] = [[at(m, m), at(1 - m, m), at(1 - m, L - m), at(m, L - m)]]
    out["settings"] = [disc(u, v, r["PLATE_W"] * 0.45) for v in r["SEATS_V"] for u in (0.16, 0.84)]
    cu, cv = r["CENTRE"]
    out["tableCentre"] = [disc(cu, cv, 0.15)]
    for place, (u, v, w) in r["TREATS"].items():
        out[place] = [disc(u, v, w / 2 + 0.01)]
    return out


json.dump({name: spots(r) for name, r in ROOMS.items()}, open("src/lib/castleGame/table-spots.generated.json", "w"))
print("ok")
