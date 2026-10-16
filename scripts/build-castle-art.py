#!/usr/bin/env python3
"""
Builds the art for "They Arrive at Midnight" (the castle room decorating game).

Reads game-art-source/castle-room.png and the item pictures in
game-art-source/castle/ and writes:
  public/game-art/castle/room.webp                   the bare room
  public/game-art/castle/patches/<item>--<place>.webp
        one transparent patch per item-in-place, already cut out, toned to the
        room's moonlight, with its contact shadow. For a chandelier the patch
        also paints out the empty hook.
  public/game-art/castle/lights/<item>--<place>.webp
        the warm glow a lit item throws on the room. The game draws it over
        everything with mix-blend-mode: screen.
  public/game-art/castle/icons/<item>.webp           clean picture for the catalog
  src/lib/castleGame/places.generated.json           positions of every patch
  game-art-source/_castle-contact.png                every item in every place
  game-art-source/_castle-preview.png                one fully decorated room

Run from the repository root:  python3 scripts/build-castle-art.py
Needs Pillow and numpy only.

The phone room (Lena, 2026-10-09) is a second, tall picture of the same hall:
    python3 scripts/build-castle-art.py --phone
reads game-art-source/castle/room-portrait.jpg and writes the same kinds of
files to public/game-art/castle/phone/ and src/lib/castleGame/places.phone.generated.json
(no icons: those are shared). The phone room shows only the three back-wall
frames; whatever hangs on the side walls is seen on a computer only.

Item pictures come from Canva's image generator on a white background; the
script cuts them out (cut_out below), so they can be dropped in as downloaded.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


# ---------------------------------------------------------------- small helpers (no scipy)
class ndimage:
    """The four things this script needs, with numpy and Pillow only."""

    @staticmethod
    def gaussian_filter(a, sigma):
        a = np.asarray(a, float)
        lo, hi = float(a.min()), float(a.max())
        if hi - lo < 1e-9:
            return a.copy()
        # 16-bit precision through two 8-bit planes is overkill; blur each
        # quarter-range band in 8 bits and recombine (Pillow blurs only 8-bit images)
        n = (a - lo) / (hi - lo) * 255 * 64
        hi8 = np.floor(n / 64)
        lo8 = (n - hi8 * 64) * 4
        bh = np.asarray(Image.fromarray(hi8.astype(np.uint8)).filter(ImageFilter.GaussianBlur(sigma)), float)
        bl = np.asarray(Image.fromarray(lo8.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sigma)), float)
        return (bh * 64 + bl / 4) / (255 * 64) * (hi - lo) + lo

    @staticmethod
    def label(mask):
        """Connected areas (4 neighbours), numbered 1..n."""
        mask = np.asarray(mask, bool)
        h, w = mask.shape
        lab = np.zeros((h, w), np.int32)
        n = 0
        ys, xs = np.nonzero(mask)
        for y0, x0 in zip(ys, xs):
            if lab[y0, x0]:
                continue
            n += 1
            stack = [(y0, x0)]
            lab[y0, x0] = n
            while stack:
                y, x = stack.pop()
                for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n
                        stack.append((yy, xx))
        return lab, n

    @staticmethod
    def sum(mask, lab, index):
        counts = np.bincount(lab.ravel(), weights=np.asarray(mask, float).ravel(),
                             minlength=max(index) + 1 if len(index) else 1)
        return counts

    @staticmethod
    def distance_transform_edt(mask, max_d=40):
        """Distance (in pixels, square steps) to the nearest False pixel; capped."""
        mask = np.asarray(mask, bool)
        d = np.where(mask, max_d, 0).astype(float)
        cur = ~mask
        im = Image.fromarray((cur * 255).astype(np.uint8))
        for k in range(1, max_d):
            im = im.filter(ImageFilter.MaxFilter(3))
            grown = np.asarray(im) > 0
            new = grown & (d == max_d)
            if not new.any():
                break
            d[new] = k
        return d


PHONE = "--phone" in sys.argv
_args = [a for a in sys.argv[1:] if not a.startswith("--")]
ROOT = _args[0] if _args else "."
SRC = os.path.join(ROOT, "game-art-source")
ITEMS_DIR = os.path.join(SRC, "castle")
OUT = os.path.join(ROOT, "public", "game-art", "castle", *(["phone"] if PHONE else []))
JSON_OUT = os.path.join(ROOT, "src", "lib", "castleGame",
                        "places.phone.generated.json" if PHONE else "places.generated.json")
SUFFIX = "-phone" if PHONE else ""


# The phone room's mantel sits lower (Lena, 2026-10-16): the hood above it is
# stretched down, the mantel moves down whole, and the opening under it gets
# shorter. Only the chimney's own columns change; the walls beside it don't.
MANTEL_DROP = 60                       # pixels: about a fifth of the fireplace below the hood
CHIMNEY_COLS = (300, 655)              # the chimney and its mantel, side to side
CHIMNEY_ROWS = (700, 1008, 1090, 1307) # hood stretch from, mantel top, under the mantel, floor


def phone_y(y):
    """Where a point of the drawn chimney ends up after the mantel is lowered."""
    a, m0, m1, f = CHIMNEY_ROWS
    d = MANTEL_DROP
    y = float(y)
    if y <= a or y >= f:
        return y
    if y <= m0:
        return a + (y - a) * (m0 + d - a) / (m0 - a)
    if y <= m1:
        return y + d
    return m1 + d + (y - m1) * (f - m1 - d) / (f - m1)


def phone_room():
    """The tall room as drawn (944 x 1888, half as wide as tall). It is close to
    the shape of a phone browser's visible area, so filling the screen trims
    only a sliver."""
    im = Image.open(os.path.join(ITEMS_DIR, "room-portrait.jpg")).convert("RGB")
    src = np.asarray(im).astype(float)
    hgt = src.shape[0]
    # for every row of the result, the row of the drawing it comes from
    a, m0, m1, f = CHIMNEY_ROWS
    d = MANTEL_DROP
    out_rows = np.arange(hgt, dtype=float)
    back = out_rows.copy()
    s1 = (out_rows > a) & (out_rows <= m0 + d)
    back[s1] = a + (out_rows[s1] - a) * (m0 - a) / (m0 + d - a)
    s2 = (out_rows > m0 + d) & (out_rows <= m1 + d)
    back[s2] = out_rows[s2] - d
    s3 = (out_rows > m1 + d) & (out_rows < f)
    back[s3] = m1 + (out_rows[s3] - m1 - d) * (f - m1) / (f - m1 - d)
    lo = np.floor(back).astype(int); hi = np.minimum(lo + 1, hgt - 1); t = (back - lo)[:, None, None]
    moved = src[lo] * (1 - t) + src[hi] * t
    # only the chimney's columns, with soft sides
    x0, x1 = CHIMNEY_COLS
    w = np.zeros(src.shape[1]); w[x0:x1] = 1
    k = np.exp(-0.5 * (np.arange(-18, 19) / 6) ** 2); k /= k.sum()
    w = np.convolve(w, k, mode="same")[None, :, None]
    res = src * (1 - w) + moved * w
    return Image.fromarray(np.clip(res, 0, 255).astype(np.uint8))


room = phone_room() if PHONE else Image.open(os.path.join(SRC, "castle-room.png")).convert("RGB")
W, H = room.size
RA = np.asarray(room).astype(float)

WARM = np.array([255, 168, 85], float)


# ---------------------------------------------------------------- cutting out
def cut_out(name):
    """White-background picture -> RGBA with soft edges and no white fringe.
    Background = near-white areas touching the border, plus near-white pockets
    (inside chain links, between arms). Only pixels right next to the
    background fade by lightness; the inside of the object stays fully solid,
    so pale silver, ivory and glass do not turn see-through."""
    im = Image.open(os.path.join(ITEMS_DIR, name)).convert("RGB")
    k = 800 / max(im.size)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    a = np.asarray(im).astype(float)
    mn = a.min(2)
    sat = a.max(2) - mn
    whiteish = (mn > 232) & (sat < 18)
    lab, n = ndimage.label(whiteish)
    edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    sizes = ndimage.sum(whiteish, lab, range(n + 1))
    keep_bg = [i for i in range(1, n + 1) if i in edge or sizes[i] > 30]
    bg = np.isin(lab, keep_bg)
    # band of pixels touching the background: soft matte by lightness
    dist = ndimage.distance_transform_edt(~bg)
    neutral = np.clip((40 - sat) / 25, 0, 1)
    fade = np.clip((mn - 90) / (245 - 90), 0, 1)
    edge_alpha = 1 - neutral * fade
    alpha = np.where(bg, 0.0, np.where(dist <= 3, edge_alpha, 1.0))
    alpha = np.clip(ndimage.gaussian_filter(alpha, 0.8), 0, 1)
    alpha[bg] = np.minimum(alpha[bg], 0.0)
    A = np.maximum(alpha, 1e-3)[..., None]
    fg = np.clip((a - (1 - A) * 255) / A, 0, 255)
    fg = np.where(alpha[..., None] > 0.02, fg, 0)
    out = Image.fromarray(np.dstack([fg, alpha * 255]).astype(np.uint8), "RGBA")
    return out.crop(out.getbbox())


def flame_mask(arr):
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    # strongly orange/yellow and bright only: ivory skulls and cream wax are not flames
    return (r > 225) & (g > 130) & (b < 130) & (r - b > 100)


def moonlight(sprite, level=0.62, lit_by_self=False, warm_reach=0.10):
    """Tone an item down to the cold room. Flames stay bright; when the item
    carries its own candles (lit_by_self) the wax and nearby parts stay warmer."""
    s = np.asarray(sprite).astype(float)
    rgb = s[..., :3]
    # only items with real candles keep bright flames (a pumpkin pie is orange too)
    fl = flame_mask(rgb) if lit_by_self else np.zeros(rgb.shape[:2], bool)
    cold = rgb * np.array([0.80, 0.86, 1.04]) * level
    if lit_by_self:
        # warmth falls off with distance from the flames
        d = ndimage.distance_transform_edt(~fl)
        near = np.exp(-(d / (warm_reach * max(s.shape[:2]))) ** 2)[..., None]
        warm = rgb * np.array([0.98, 0.86, 0.70]) * 0.92
        cold = cold * (1 - near) + warm * near
    rgb = np.where(fl[..., None], rgb, cold)
    s[..., :3] = np.clip(rgb, 0, 255)
    return Image.fromarray(s.astype(np.uint8), "RGBA")


def resize_h(sp, h):
    return sp.resize((max(1, round(sp.width * h / sp.height)), round(h)), Image.LANCZOS)


def resize_w(sp, w):
    return sp.resize((round(w), max(1, round(sp.height * w / sp.width))), Image.LANCZOS)


# ---------------------------------------------------------------- canvases
class Layer:
    """A full-room RGBA canvas that is cropped to its content when saved."""

    def __init__(self):
        self.im = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    def paste(self, sp, x, y):
        tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        tmp.paste(sp, (round(x), round(y)))
        self.im = Image.alpha_composite(self.im, tmp)

    def box(self):
        return self.im.getbbox()


def contact_shadow(layer, cx, base_y, width, depth=0.18, strength=0.55):
    sh = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(sh)
    w2, h2 = width / 2, max(3, width * depth / 2)
    d.ellipse([cx - w2, base_y - h2, cx + w2, base_y + h2 * 0.8], fill=int(255 * strength))
    sh = sh.filter(ImageFilter.GaussianBlur(max(2, width * 0.06)))
    black = Image.new("RGBA", (W, H), (5, 5, 12, 0))
    black.putalpha(sh)
    layer.im = Image.alpha_composite(layer.im, black)


def standing(sprite, cx, base_y, height, lit=False, level=0.62, shadow=True, width=None):
    """An item standing on a surface: bottom-centre at (cx, base_y)."""
    sp = resize_w(sprite, width) if width else resize_h(sprite, height)
    sp = moonlight(sp, level, lit)
    L = Layer()
    if shadow:
        contact_shadow(L, cx, base_y - 2, sp.width * 0.9)
    L.paste(sp, cx - sp.width / 2, base_y - sp.height + 2)
    return L, sp, (cx - sp.width / 2, base_y - sp.height + 2)


def perspective_coeffs(dst, src):
    """Coefficients for Image.transform(PERSPECTIVE) mapping dst quad -> src quad."""
    A, B = [], []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); B.append(v)
    return np.linalg.solve(np.array(A, float), np.array(B, float)).tolist()


def warp_to_quad(sp, quad):
    """Map a flat picture onto a quad in the room (TL, TR, BR, BL)."""
    w, h = sp.size
    c = perspective_coeffs(quad, [(0, 0), (w, 0), (w, h), (0, h)])
    return sp.transform((W, H), Image.PERSPECTIVE, c, Image.BICUBIC)


def grow(quad, f):
    cx = sum(p[0] for p in quad) / 4
    cy = sum(p[1] for p in quad) / 4
    return [(cx + (x - cx) * f, cy + (y - cy) * f) for x, y in quad]


# ---------------------------------------------------------------- light
yy, xx = np.mgrid[0:H, 0:W]


def glow(cx, cy, radius, strength, squash=0.85):
    d = np.sqrt((xx - cx) ** 2 + ((yy - cy) / squash) ** 2)
    return np.exp(-(d / radius) ** 2) * strength


def light_layer(intensity):
    """Warm light as an RGBA picture meant for mix-blend-mode: screen."""
    I = np.clip(intensity, 0, 1)[..., None]
    rgb = WARM * I
    a = np.clip(I[..., 0] * 255 * 1.0, 0, 255)
    # store premultiplied-looking colour at full alpha where lit: for screen
    # blending the colour itself is what matters, alpha just trims the file
    return Image.fromarray(np.dstack([rgb, np.where(a > 1, 255, 0)]).astype(np.uint8), "RGBA")


def flame_halos(sp, ox, oy, size=14, strength=0.55):
    s = np.asarray(sp)
    fl = flame_mask(s[..., :3].astype(float)) & (s[..., 3] > 200)
    m = np.zeros((H, W))
    ys, xs = np.nonzero(fl)
    ys = ys + round(oy); xs = xs + round(ox)
    ok = (ys >= 0) & (ys < H) & (xs >= 0) & (xs < W)
    m[ys[ok], xs[ok]] = 1
    if not m.any():
        return m, None
    m = ndimage.gaussian_filter(m, size)
    m = m / m.max() * strength
    return m, (xs[ok].mean(), ys[ok].mean())


def screen(base, light):
    b = np.asarray(base).astype(float)
    l = np.asarray(light).astype(float)[..., :3]
    out = 255 - (255 - b[..., :3]) * (255 - l) / 255
    return Image.fromarray(out.astype(np.uint8))


# ---------------------------------------------------------------- items
# id -> (file, kind, lit)
ITEMS = {
    "chandelierIron": ("chandelier-iron.png", "chandelier", True),
    "chandelierAntler": ("chandelier-antler.png", "chandelier", True),
    "chandelierCrystal": ("chandelier-crystal.png", "chandelier", True),
    # candelabras live on the shelf and mantel only; drawn from the side and
    # slightly from below, because both ledges are above eye level
    # frontal pictures: the Emporium and the phone chimney show them face on (Lena, 2026-10-14)
    "candelabraSilver": ("candelabra-silver.png", "standing", True),
    "candelabraBlackWax": ("candelabra-blackwax.png", "standing", True),
    "candelabraSkull": ("candelabra-skull.png", "standing", True),
    "candelabraSilverFive": ("candelabra-silverfive.png", "standing", True),
    # candle groups: round, so they look right from any side; drawn seen
    # from slightly below for the high shelf and mantel
    "candlesSkull": ("candles-skull.png", "standing", True),
    "vaseBlackRoses": ("vase-blackroses.png", "standing", False),
    "vaseLavender": ("vase-lavender.png", "standing", False),
    "vaseLilies": ("vase-lilies.png", "standing", False),
    "vaseRavenRoses": ("vase-ravenroses.png", "standing", False),
    "mirrorGilt": ("mirror-gilt.png", "wall", False),
    "mirrorGhost": ("mirror-ghost.png", "wall", False),
    "paintingRaven": ("painting-raven.png", "wall", False),
    "paintingSea": ("painting-sea.png", "wall", False),
    "paintingLady": ("painting-lady.png", "wall", False),
    "paintingCastle": ("painting-castle.png", "wall", False),
    "paintingAncestor": ("painting-ancestor.png", "wall", False),
    "clothWhite": ("cloth-white.png", "cloth", False),
    "clothBlackLace": ("cloth-blacklace.png", "cloth", False),
    "clothRedVelvet": ("cloth-redvelvet.png", "cloth", False),
    # plate + cutlery photographed from straight above (laid flat on the table
    # through the table's perspective) and a goblet seen from the side
    "settingPewter": (("plate-pewter-top.png", "goblet-pewter.png"), "setting", False),
    "settingSilver": (("plate-silver-top.png", "goblet-black.png"), "setting", False),
    "settingCrystal": (("plate-crystal-top.png", "goblet-crystal.png"), "setting", False),
    "treatPie": ("treat-pie.png", "treat", False),
    "treatApples": ("treat-apples.png", "treat", False),
    "treatCupcakes": ("treat-cupcakes.png", "treat", False),
    "treatCookies": ("treat-cookies.png", "treat", False),
    "treatCakePops": ("treat-cakepops.png", "treat", False),
    "treatCake": ("treat-cake.png", "treat", True),
    "gramophone": ("gramophone.png", "gramophone", False),
    "firewood": ("fire.png", "fire", True),      # catalog picture: firewood.png
    # records: owned, never placed — catalog pictures only
    "recordWaltz": ("record-waltz.png", "record", False),
    "recordOrgan": ("record-organ.png", "record", False),
    "recordLullaby": ("record-lullaby.png", "record", False),
}
ICON_FILE = {"firewood": "firewood.png",
             "settingPewter": "setting-pewter.png", "settingSilver": "setting-silver.png",
             "settingCrystal": "setting-crystal.png"}

# ---------------------------------------------------------------- places
# Measured on castle-room.png (1600 x 899).
CHAIN_END = (797, -28)         # chandelier hangs high (Lena, 2026-10-16); its own chain runs up out of the picture
TABLE = [(662, 508), (920, 508), (1162, 742), (420, 742)]   # table top TL TR BR BL
TABLE_FRONT_BOTTOM = 782

WALLS = {   # TL, TR, BR, BL of each faded patch where an old frame hung
    "wallLeft": [(28, 108), (133, 132), (133, 432), (28, 442)],
    "wallBackLeft": [(540, 215), (640, 215), (640, 400), (540, 400)],
    "wallBackCentre": [(698, 195), (892, 195), (892, 408), (698, 408)],
    "wallBackRight": [(952, 215), (1048, 215), (1048, 400), (952, 400)],
    "wallRight": [(1118, 215), (1172, 197), (1172, 408), (1118, 400)],
}
STANDS = {  # base centre x, base y, item height, light level
    "tableCentre": (792, 588, 180, 0.66),
}
# Table top as a real rectangle: u across (0 left edge .. 1 right edge),
# v along (0 front edge .. TABLE_LEN back edge), in table-widths. The length
# comes from the chairs: three evenly spaced chairs a side, the far one at the
# back edge, the near one about a third of a width from the front.
TABLE_LEN = 1.45
SEATS_V = [1.20, 0.75, 0.30]          # the three chairs each side, far to near
PLATE_W = 0.40                         # plate width in table-widths
# Down the middle of the table, clear of the plates. The centre piece stands
# furthest back so the two treats in front of it never hide it.
CENTRE_PIECE = (0.50, 1.20, 0.62)      # u, v, height in table-widths; v = a pair of plates
TREATS = {"treatFront": (0.50, 0.30, 0.22), "treatMiddle": (0.50, 0.75, 0.22)}   # u, v, width; between the plates
GRAMOPHONE = (1203, 178, 110)           # wall plate on the right corner column, horn height
# Wall shelf: its top edge runs along the right wall, towards the vanishing
# point of the room (791, 383); items stand on it and the board hides their foot.
VANISH = (791, 383)


def shelf_edge(x):
    """Top silhouette of the wall shelf: the slanted front board, then the
    flat top of its side panel (measured)."""
    x = np.asarray(x, float)
    return np.where(x < 1263, 284 - 0.396 * (x - 1210), 262.0)


def mantel_edge(x):
    """Back edge of the mantel top, where it meets the chimney (measured; it
    runs along the right wall). The top itself is a visible band about 15
    pixels deep below this line."""
    return 304 - 0.233 * (np.asarray(x, float) - 1380)


# On the computer the mantel and shelf run along the side wall: candelabras stand
# turned along it, so the room uses side pictures of the same candelabras.
LEDGE_SIDE_FILE = {"candelabraSilver": "candelabra-silver-side.png",
                   "candelabraBlackWax": "candelabra-blackwax-side.png",
                   "candelabraSkull": "candelabra-skull-side.png",
                   "candelabraSilverFive": "grand-silver5.png"}
LEDGES = {"shelf": (1262, shelf_edge, 125, 0.55), "mantel": (1440, mantel_edge, 180, 0.60)}
LEDGE_GLOW = {"shelf": 150, "mantel": 180}
LEDGE_SHADOW = (-9, -3)                # candelabra's shadow on the wall behind: the wall runs away from us
FIRE = (1463, 683, 116)                # centre x, base y, width: middle of the fireplace
FIRE_SPILL = 100                       # the warm spill on the floor lies this far to the left
FIRE_LIGHT = (300, 0.20, 230, 0.14)    # glow round the fire (radius, strength), spill on the floor
FIRE_SPREAD = None                     # phone: (height, flatten) of a wide, low fire
FIRE_INSIDE = 0.40                     # how brightly the inside of the fireplace glows
FIRE_HEARTH = 0                        # phone: how far the glow runs over the hearth floor

PLACES = {
    "ceiling": ["chandelierIron", "chandelierAntler", "chandelierCrystal"],
    # no candles on the table: they fight with the chandelier
    "tableCentre": ["vaseBlackRoses", "vaseLavender", "vaseLilies", "vaseRavenRoses"],
    "mantel": ["candelabraSilver", "candelabraBlackWax", "candelabraSkull", "candelabraSilverFive",
               "candlesSkull",
               "vaseBlackRoses", "vaseLavender", "vaseLilies", "vaseRavenRoses"],
    "shelf": ["candelabraSilver", "candelabraBlackWax", "candelabraSkull", "candelabraSilverFive",
              "candlesSkull",
              "vaseBlackRoses", "vaseLavender", "vaseLilies", "vaseRavenRoses"],
    **{w: ["mirrorGilt", "mirrorGhost", "paintingRaven", "paintingSea",
           "paintingLady", "paintingCastle", "paintingAncestor"] for w in WALLS},
    "cloth": ["clothWhite", "clothBlackLace", "clothRedVelvet"],
    "settings": ["settingPewter", "settingSilver", "settingCrystal"],
    "treatFront": ["treatPie", "treatApples", "treatCupcakes", "treatCookies", "treatCakePops", "treatCake"],
    "treatMiddle": ["treatPie", "treatApples", "treatCupcakes", "treatCookies", "treatCakePops", "treatCake"],
    "corner": ["gramophone"],
    "fireplace": ["firewood"],
}
# Drawing order, back to front
ORDER = ["wallLeft", "wallBackLeft", "wallBackCentre", "wallBackRight", "wallRight",
         "shelf", "fireplace", "mantel", "ceiling", "corner", "cloth", "settings", "tableCentre", "treatMiddle",
         "treatFront"]


# ---------------------------------------------------------------- builders
HOOK_CUT = (60, 198, 774, 822, 48)    # rows, columns of the hook, and how far to shift the wall
CHANDELIER_SCALE = 1.0
TABLE_POOL = (792, 600, 230)           # where the chandelier's light pools on the table


def hook_cover():
    """The room's own wall, shifted sideways, painted over the hook (and, on
    the phone, over the chain below where the chandelier now hangs).
    HOOK_CUT is one (rows, columns, shift) box or a list of them."""
    boxes = HOOK_CUT if isinstance(HOOK_CUT, list) else [HOOK_CUT]
    colour = np.zeros((H, W, 3)); weight = np.zeros((H, W)); alpha = np.zeros((H, W))
    for y0, y1, x0, x1, shift in boxes:
        cut = np.zeros((H, W)); cut[y0:y1, x0:x1] = 1
        cut = ndimage.gaussian_filter(cut, 3)
        colour += np.roll(RA, shift, axis=1) * cut[..., None]
        weight += cut
        alpha = np.maximum(alpha, cut)
    colour = colour / np.maximum(weight, 1e-6)[..., None]   # one box: exactly the shifted wall
    return Image.fromarray(np.dstack([colour, alpha * 255]).astype(np.uint8), "RGBA")


def build_chandelier(item):
    sp = cut_out(ITEMS[item][0])
    width = {"chandelierIron": 300, "chandelierAntler": 300, "chandelierCrystal": 250}[item] * CHANDELIER_SCALE
    sp = moonlight(resize_w(sp, width), 0.70, True)
    L = Layer()
    L.im = Image.alpha_composite(L.im, hook_cover())
    x0, y0 = CHAIN_END[0] - sp.width / 2, CHAIN_END[1] - 4
    L.paste(sp, x0, y0)
    halo, c = flame_halos(sp, x0, y0, 14, 0.30)
    px, py, pr = TABLE_POOL
    I = halo + glow(c[0], c[1], 300, 0.42) + glow(c[0], c[1], 110, 0.20) \
        + glow(px, py, pr, 0.22, 0.45)          # pool of light on the table
    return L, I


def build_standing(item, place):
    cx, by, h, level = STANDS[place]
    if place == "tableCentre":
        u, v, hu = CENTRE_PIECE
        cx, by = on_table(u, v)
        h = hu * px_per_unit(u, v)
    sp = cut_out(ITEMS[item][0])
    lit = ITEMS[item][2]
    if not lit:
        h *= 1.05
    L, spr, (ox, oy) = standing(sp, cx, by, h, lit, level)
    I = None
    if lit:
        halo, c = flame_halos(spr, ox, oy, 10, 0.28)
        r = {"tableCentre": 230, "mantel": 200, "shelf": 160}[place]
        I = halo + glow(c[0], c[1], r, 0.30) + glow(cx, by, r * 0.7, 0.14, 0.45)
    return L, I


def build_wall(item, place):
    sp = cut_out(ITEMS[item][0])
    q = WALLS[place]
    # keep the picture's own proportions: height of the patch, width from the
    # picture, centred on the patch (perspective walls keep their slant)
    top = (q[0][1] + q[1][1]) / 2; bot = (q[2][1] + q[3][1]) / 2
    ph = (bot - top) * 1.06
    left = (q[0][0] + q[3][0]) / 2; right = (q[1][0] + q[2][0]) / 2
    pw = right - left
    flat = place in ("wallBackLeft", "wallBackCentre", "wallBackRight")
    if PHONE and not flat:
        # the side wall is seen at an angle: the picture lies in the wall's own
        # perspective (Lena, 2026-10-14). Fitted in the panel as if seen face on
        # (panel about half as wide as tall), then carried onto the slanted panel.
        Hq = homography([(0, 0), (1, 0), (1, 1), (0, 1)], q)
        a = sp.width / sp.height
        hv = 0.92; wu = a * hv / 0.52
        if wu > 0.94:
            hv *= 0.94 / wu; wu = 0.94
        u0, v0 = (1 - wu) / 2, (1 - hv) / 2

        def on_wall(u, v):
            pt = Hq @ np.array([u, v, 1.0])
            return (pt[0] / pt[2], pt[1] / pt[2])

        quad = [on_wall(u0, v0), on_wall(u0 + wu, v0), on_wall(u0 + wu, v0 + hv), on_wall(u0, v0 + hv)]
    elif PHONE:
        # narrow pointed frames: the picture fits inside, never wider than the frame
        k = min(pw * 0.96 / sp.width, ph * 0.94 / sp.height)
        w, h2 = sp.width * k, sp.height * k
        cx = (left + right) / 2; cy = (top + bot) / 2
        quad = [(cx - w / 2, cy - h2 / 2), (cx + w / 2, cy - h2 / 2),
                (cx + w / 2, cy + h2 / 2), (cx - w / 2, cy + h2 / 2)]
    elif flat:
        natural = ph * sp.width / sp.height
        w = min(max(natural, pw * 1.04), natural * 1.18)   # stretch at most 18%
        cx = (left + right) / 2; cy = (top + bot) / 2
        quad = [(cx - w / 2, cy - ph / 2), (cx + w / 2, cy - ph / 2),
                (cx + w / 2, cy + ph / 2), (cx - w / 2, cy + ph / 2)]
    else:
        quad = grow(q, 1.06)
    sp = moonlight(sp, 0.58)
    warped = warp_to_quad(sp, quad)
    L = Layer()
    # soft shadow the frame casts on the wall
    sh = warped.getchannel("A").filter(ImageFilter.GaussianBlur(6))
    shadow = Image.new("RGBA", (W, H), (0, 0, 8, 0)); shadow.putalpha(sh.point(lambda v: v * 0.5))
    off = Image.new("RGBA", (W, H), (0, 0, 0, 0)); off.paste(shadow, (5, 7))
    L.im = Image.alpha_composite(L.im, off)
    L.im = Image.alpha_composite(L.im, warped)
    return L, None


CLOTH = {   # table top quad (hangs a little over the edges), front drop x, y, width, height,
            # rows of the table top, and a box on the bare table for its usual brightness
    "top": [(650, 503), (932, 503), (1180, 744), (402, 744)],
    "drop": (401, 742, 780, 125),
    "rows": (500, 745),
    "ref": (520, 740, 600, 980),
}


def build_cloth(item):
    tex = Image.open(os.path.join(ITEMS_DIR, ITEMS[item][0])).convert("RGB")
    tex = tex.resize((800, 800), Image.LANCZOS)
    t = np.asarray(tex).astype(float)
    # table top: the cloth hangs a little over the edges
    top_q = CLOTH["top"]
    L = Layer()
    if PHONE:
        # the tall table is long: repeat the cloth along it so the weave keeps its size
        t = np.concatenate([t, t[::-1], t], axis=0)
    L.im = Image.alpha_composite(L.im, warp_to_quad(Image.fromarray(t.astype(np.uint8)).convert("RGBA"), top_q))
    # front drop with a wavy hem
    dx, dy, dw, dh = CLOTH["drop"]
    drop = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    strip = tex.crop((0, 0, 800, 200)).resize((dw, dh)).convert("RGBA")
    sa = np.asarray(strip).astype(float)
    # folds: darker bands
    xs = np.arange(sa.shape[1])
    fold = 0.78 + 0.22 * np.cos(xs / dw * np.pi * 14) ** 2
    sa[..., :3] *= fold[None, :, None] * 0.55   # the drop faces us, away from the light
    hem = (dh - 13) + 9 * dh / 125 * np.sin(xs / dw * np.pi * 14)
    rows = np.arange(sa.shape[0])[:, None]
    sa[..., 3] = np.where(rows < hem[None, :], 255, 0)
    drop.paste(Image.fromarray(sa.astype(np.uint8), "RGBA"), (dx, dy))
    L.im = Image.alpha_composite(L.im, drop)
    L.im = moonlight(L.im, 0.55)
    # the table's own shading (light pool, edges) shows through the cloth
    shade = RA.mean(2)
    tm = np.asarray(L.im).astype(float)
    ry0, ry1, rx0, rx1 = CLOTH["ref"]
    ref = np.percentile(shade[ry0:ry1, rx0:rx1], 60)
    k = np.clip(shade / max(ref, 1), 0.55, 1.35)[..., None]
    region = np.zeros((H, W), bool); region[CLOTH["rows"][0]:CLOTH["rows"][1], :] = True
    tm[..., :3] = np.where(region[..., None], np.clip(tm[..., :3] * (0.55 + 0.45 * k), 0, 255), tm[..., :3])
    L.im = Image.fromarray(tm.astype(np.uint8), "RGBA")
    return L, None


def table_width(y):
    t = (y - TABLE[0][1]) / (TABLE[3][1] - TABLE[0][1])
    lx = TABLE[0][0] + (TABLE[3][0] - TABLE[0][0]) * t
    rx = TABLE[1][0] + (TABLE[2][0] - TABLE[1][0]) * t
    return lx, rx


SEATS_Y = [548, 600, 690]   # depth of the three chairs each side


def homography(src, dst):
    A = []
    for (x, y), (u, v) in zip(src, dst):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y, -u])
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y, -v])
    _, _, vt = np.linalg.svd(np.array(A, float))
    Hm = vt[-1].reshape(3, 3)
    return Hm / Hm[2, 2]


TABLE_H = homography([(0, 0), (1, 0), (1, TABLE_LEN), (0, TABLE_LEN)],
                     [TABLE[3], TABLE[2], TABLE[1], TABLE[0]])


def on_table(u, v):
    p = TABLE_H @ np.array([u, v, 1.0])
    return p[0] / p[2], p[1] / p[2]


def px_per_unit(u, v):
    a = on_table(u - 0.05, v); b = on_table(u + 0.05, v)
    return (b[0] - a[0]) / 0.1


def lay_flat(sp, u0, v0, width, facing):
    """Lay a straight-from-above picture on the table. The picture's 'up' is
    the diner's forward; facing +1 = diner on the left looking right."""
    w, h = sp.size
    k = width / w
    corners = []
    for px, py in [(0, 0), (w, 0), (w, h), (0, h)]:
        r = (px - w / 2) * k            # to the diner's right
        t = (py - h / 2) * k            # towards the diner
        if facing > 0:
            u, v = u0 - t, v0 - r
        else:
            u, v = u0 + t, v0 + r
        corners.append(on_table(u, v))
    return warp_to_quad(sp, corners)


def split_pieces(sp):
    """A setting picture holds fork, plate and knife side by side: separate them
    (left to right), each on a canvas the size of the whole picture."""
    a = np.asarray(sp)
    lab, n = ndimage.label(a[..., 3] > 60)
    sizes = np.bincount(lab.ravel())[1:]
    keep = [i + 1 for i in np.argsort(sizes)[::-1][:3]]
    keep.sort(key=lambda i: np.nonzero(lab == i)[1].mean())
    out = []
    for i in keep:
        m = np.asarray(Image.fromarray(((lab == i) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
        b = a.copy()
        b[..., 3] = np.where(m, b[..., 3], 0)
        out.append(Image.fromarray(b, "RGBA"))
    return out          # fork, plate, knife


def relief(piece, kind):
    """Light from above the middle of the table, which is the top of the
    picture (the diner's forward). A plate is a dish: high rim, sunken well, so
    the well's far wall falls in shadow and its near wall catches the light.
    Cutlery is rounded: lit along its top edge, darker along the bottom."""
    a = np.asarray(piece).astype(float)
    al = a[..., 3] / 255
    ys, xs = np.nonzero(al > 0.5)
    if kind == "plate":
        cx, cy = xs.mean(), ys.mean()
        R = (xs.max() - xs.min() + ys.max() - ys.min()) / 4
        yy_, xx_ = np.mgrid[0:a.shape[0], 0:a.shape[1]]
        r = np.sqrt((xx_ - cx) ** 2 + (yy_ - cy) ** 2) / R
        t = np.clip((r - 0.60) / 0.12, 0, 1)
        h = t * t * (3 - 2 * t) * R * 0.10          # the rim stands above the well
        strength, tilt = 7.0, (0.9 + 0.2 * np.clip((cy - yy_) / R, -1, 1))
    else:
        h = ndimage.gaussian_filter(al, 2.0) * 3.0
        strength, tilt = 2.2, 1.0
    gy = np.gradient(h, axis=0)
    shade = np.clip(1 + strength * gy / max(1.0, a.shape[0] / 150), 0.55, 1.45) * tilt
    a[..., :3] = np.clip(a[..., :3] * shade[..., None], 0, 255)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def lifted(warped, k, thick, lift, away):
    """Shadow on the cloth and the edge's thickness under a piece lying on the
    table. k: pixels per table-width there; away: +1 if the light comes from
    the right (the shadow falls left)."""
    A = np.asarray(warped.getchannel("A")).astype(float)
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # soft shadow, pushed towards the viewer and away from the light
    off_y, off_x = lift * k, -away * lift * k * 0.6
    sh = Image.fromarray(A.astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(1.0, lift * k * 0.9)))
    shadow = Image.new("RGBA", (W, H), (3, 2, 8, 0))
    shadow.putalpha(sh.point(lambda v: int(v * 0.62)))
    tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); tmp.paste(shadow, (round(off_x), round(off_y)))
    out = Image.alpha_composite(out, tmp)
    # the edge: the same outline a little lower, dark (it faces away from the light)
    t = max(1, round(thick * k))
    edge = np.asarray(warped).astype(float).copy()
    solid = edge[..., 3] > 128
    tone = edge[..., :3][solid].mean(0) * 0.42 if solid.any() else np.zeros(3)
    edge[..., :3] = tone          # one plain dark tone: a metal edge in shadow, no pattern
    for dy in range(t, 0, -1):
        tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        tmp.paste(Image.fromarray(edge.astype(np.uint8), "RGBA"), (0, dy))
        out = Image.alpha_composite(out, tmp)
    return out


def build_settings(item):
    plate_f, goblet_f = ITEMS[item][0]
    pieces = split_pieces(cut_out(plate_f))
    kinds = ["cutlery", "plate", "cutlery"]
    pieces = [moonlight(relief(pc, kd), 0.70) for pc, kd in zip(pieces, kinds)]
    goblet = cut_out(goblet_f)
    L = Layer()
    goblets = []
    far = max(SEATS_V)
    for v in SEATS_V:
        for u0, facing in ((0.16, 1), (0.84, -1)):
            k = float(px_per_unit(u0, v))
            # further away: a little darker and softer, like the rest of the room
            dim = 1 - 0.16 * (v / far)
            for pc, kd in zip(pieces, kinds):
                w = lay_flat(pc, u0, v, PLATE_W, facing)
                wa = np.asarray(w).astype(float)
                wa[..., :3] *= dim
                w = Image.fromarray(wa.astype(np.uint8), "RGBA")
                if v / far > 0.6:
                    w = w.filter(ImageFilter.GaussianBlur(0.5))
                under = lifted(w, k, 0.010 if kd == "plate" else 0.004,
                               0.012 if kd == "plate" else 0.007, facing)
                L.im = Image.alpha_composite(L.im, under)
                L.im = Image.alpha_composite(L.im, w)
            gu = u0 + 0.19 * facing
            gv = v - 0.10 * facing
            goblets.append((gv, gu))
    for gv, gu in sorted(goblets, reverse=True):       # far ones first
        x, y = on_table(gu, gv)
        g = moonlight(resize_h(goblet, 0.17 * px_per_unit(gu, gv)), 0.66)
        contact_shadow(L, x, y - 1, g.width * 0.8, 0.30, 0.40)
        L.paste(g, x - g.width / 2, y - g.height + 2)
    return L, None


def build_treat(item, place):
    u, v, wu = TREATS[place]
    cx, by = on_table(u, v)
    w = wu * px_per_unit(u, v)
    sp = cut_out(ITEMS[item][0])
    lit = ITEMS[item][2]
    L, spr, (ox, oy) = standing(sp, cx, by, None, lit, 0.68, True, width=w)
    I = None
    if lit:
        halo, c = flame_halos(spr, ox, oy, 7, 0.22)
        I = halo + glow(c[0], c[1], 90, 0.15)
    return L, I


def build_gramophone():
    """In the room only the gramophone's horn shows, mounted on the wall in the
    right corner and turned towards the room (Lena, 2026-10-14). The catalog
    keeps the whole gramophone. GRAMOPHONE = wall plate centre x, y, horn height."""
    px, py, h = GRAMOPHONE
    sp = Image.open(os.path.join(ITEMS_DIR, "gramophone-horn.png")).convert("RGBA")
    k = h / sp.height
    sp = sp.resize((round(sp.width * k), round(sp.height * k)), Image.LANCZOS)
    sp = moonlight(sp, 0.70)
    # the wall plate sits at the right edge, 128/163 of the way down
    x0, y0 = px - sp.width + 1, py - sp.height * 128 / 163
    L = Layer()
    sh = Image.new("RGBA", sp.size, (0, 0, 0, 0))
    sh.putalpha(sp.getchannel("A").point(lambda v: v * 0.45).filter(ImageFilter.GaussianBlur(4)))
    L.paste(sh, x0 + 5, y0 + 7)     # soft shadow on the wall behind
    L.paste(sp, x0, y0)
    return L, None


def seat_top(spr, cx, edge, sink):
    """The ledge edge slopes, so a level foot can only touch it at one point.
    Seat the foot on the LOWEST part of the edge under it: the whole foot then
    goes behind the edge, with no gap of air under either side."""
    a = np.asarray(spr)[..., 3]
    rows = a[int(a.shape[0] * 0.92):]
    cols = np.nonzero(rows.max(0) > 128)[0]
    x0 = cx - spr.width / 2
    xs = x0 + cols if len(cols) else np.array([cx])
    return float(np.max(edge(xs))) + sink - spr.height


def build_ledge(item, place):
    """Shelf and mantel are above eye level, so we never see their top: an item
    standing on one has its foot hidden behind the front edge. Candelabras are
    turned to stand along the wall, their arms following the edge into the
    distance; vases are round and just stand."""
    cx, edge, h, level = LEDGES[place]
    sp = cut_out(ITEMS[item][0])
    lit = ITEMS[item][2]
    L = Layer()
    # how far below the measured line the foot stands, and where the ledge's
    # front edge starts hiding things
    sink, hide = {"mantel": (4, 0), "shelf": (4, 0)}[place]
    if item.startswith("candelabra"):
        # a picture of the candelabra from its side, candles one behind
        # another, so it stands along the wall with real depth
        sp = cut_out(LEDGE_SIDE_FILE[item])
        spr = moonlight(resize_h(sp, h), level * 1.15, True, warm_reach=0.035)
        # its own soft shadow on the wall behind, so it stands off the wall
        sh = spr.getchannel("A").filter(ImageFilter.GaussianBlur(5)).point(lambda v: v * 0.45)
        shadow = Image.new("RGBA", spr.size, (4, 4, 10, 0)); shadow.putalpha(sh)
        top = seat_top(spr, cx, edge, sink)
        L.paste(shadow, cx - spr.width / 2 + LEDGE_SHADOW[0], top + LEDGE_SHADOW[1])
    elif lit:
        spr = moonlight(resize_h(sp, h * 0.85), level * 0.85, True, warm_reach=0.06)
    else:
        spr = moonlight(resize_h(sp, h * 1.05), level)
    top = seat_top(spr, cx, edge, sink)
    # a soft contact shadow where the foot meets the ledge
    a = np.asarray(spr)[..., 3]
    cols = np.nonzero(a[int(a.shape[0] * 0.92):].max(0) > 128)[0]
    fw = (cols[-1] - cols[0]) if len(cols) else spr.width * 0.5
    fx = cx - spr.width / 2 + ((cols[0] + cols[-1]) / 2 if len(cols) else spr.width / 2)
    contact_shadow(L, float(fx), float(top + spr.height - 2), float(fw * 1.1), 0.22, 0.55)
    L.paste(spr, cx - spr.width / 2, top)
    a = np.asarray(L.im).copy()
    cut = edge(np.arange(W)) + hide
    a[..., 3] = np.where(np.arange(H)[:, None] > cut[None, :], 0, a[..., 3])
    L.im = Image.fromarray(a, "RGBA")
    I = None
    if lit:
        halo, c = flame_halos(L.im, 0, 0, 8, 0.22)
        # light sits above the candles so the body below stays in its own shadow
        I = halo + glow(c[0], c[1] - 10, LEDGE_GLOW[place], 0.17)
        # the glow lights the wall, not the holder's own metal: keeps silver
        # silver and iron black instead of washing them gold
        body = np.asarray(L.im)[..., 3] / 255.0
        I = I * (1 - 0.85 * body)
    return L, I


ANDIRONS = [   # measured outlines; painted back over the fire, they stand in front of it
    ("ellipse", (1384, 553, 1400, 582)), ("rect", (1387, 579, 1397, 633)),
    ("poly", [(1386, 627), (1398, 627), (1407, 668), (1401, 670), (1392, 641), (1372, 663), (1366, 660)]),
    ("ellipse", (1469, 575, 1486, 606)), ("rect", (1472, 603, 1483, 665)),
    ("poly", [(1471, 659), (1484, 659), (1497, 694), (1490, 696), (1478, 673), (1452, 692), (1445, 688)]),
]
FIRE_OPENING = [(1377, 690), (1377, 450), (1400, 420), (1443, 403), (1488, 420), (1510, 450), (1510, 690)]


def build_fire():
    """Bought firewood lights the fireplace. Logs are solid and dark; flames are
    see-through light (screen), so the fireplace shows through them; the inside
    of the fireplace glows; the andirons stand in front as dark shapes."""
    cx, by, w = FIRE
    im = Image.open(os.path.join(ITEMS_DIR, ITEMS["firewood"][0])).convert("RGB")
    im = im.crop(Image.eval(im.convert("L"), lambda v: 255 if v > 14 else 0).getbbox())
    if FIRE_SPREAD:
        # A wide, low fire (Lena, 2026-10-16): the same single fire, one
        # natural mound of flames, only drawn wider and lower than it is tall.
        hgt, _ = FIRE_SPREAD
        im = im.resize((w, hgt), Image.LANCZOS)
    else:
        im = resize_w(im, w)
    a = np.asarray(im).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(2)
    flame = np.clip((r - b - 60) / 80, 0, 1) * np.clip((mx - 120) / 80, 0, 1)
    solid = np.clip((mx - 14) / 30, 0, 1) * (1 - flame)          # logs, not flames
    x0, y0 = round(cx - im.width / 2), round(by - im.height)
    L = Layer()
    logs = a * np.array([0.55, 0.42, 0.36])[None, None, :]       # bark in shadow, lit from above by flames
    logs = np.where(flame[..., None] > 0, a, logs)
    # flames keep their painted shape (mostly opaque at the core, soft at the tips)
    alpha = np.maximum(solid, flame * 0.88)
    tmp = Image.fromarray(np.dstack([logs, alpha * 255]).astype(np.uint8), "RGBA")
    L.paste(tmp, x0, y0)
    if PHONE:
        # only the part inside the fireplace's opening shows
        clip = Image.new("L", (W, H), 0)
        ImageDraw.Draw(clip).polygon(FIRE_OPENING, fill=255)
        clip = clip.filter(ImageFilter.GaussianBlur(1.5))
        L.im.putalpha(Image.fromarray((np.asarray(L.im.getchannel("A")) * (np.asarray(clip) / 255)).astype(np.uint8)))
    # andirons in front, taken from the room itself
    m = Image.new("L", (W, H), 0); d = ImageDraw.Draw(m)
    for kind, geo in ANDIRONS:
        {"ellipse": d.ellipse, "rect": d.rectangle, "poly": d.polygon}[kind](geo, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(0.7))
    if ANDIRONS:
        andiron = room.convert("RGBA"); andiron.putalpha(m)
        L.im = Image.alpha_composite(L.im, andiron)
    # light: the flames themselves (soft, see-through), the glowing inside of
    # the fireplace, and the warm spill into the room
    F = np.zeros((H, W))
    fh, fw = im.height, min(im.width, W - x0)       # the phone room cuts the fire at its edge
    F[y0:y0 + fh, x0:x0 + fw] = (flame * (mx / 255))[:, :fw]
    F = F * 0.25 + ndimage.gaussian_filter(F, 12) * 0.9
    inside = Image.new("L", (W, H), 0)
    ImageDraw.Draw(inside).polygon(FIRE_OPENING, fill=255)
    if FIRE_HEARTH:
        # the glow runs out over the hearth floor in front and fades, instead
        # of stopping at a hard line (Lena, 2026-10-16)
        xs = [p[0] for p in FIRE_OPENING]; yb = max(p[1] for p in FIRE_OPENING)
        ImageDraw.Draw(inside).polygon([(min(xs), yb - 4), (max(xs), yb - 4),
                                        (max(xs) + 24, yb + FIRE_HEARTH), (min(xs) - 24, yb + FIRE_HEARTH)], fill=150)
    inside = np.asarray(inside.filter(ImageFilter.GaussianBlur(14 if FIRE_HEARTH else 8))) / 255
    big_r, big_s, spill_r, spill_s = FIRE_LIGHT
    I = F + inside * glow(cx, by - 30, 110, FIRE_INSIDE, 1.2) + glow(cx, by - 40, big_r, big_s, 0.9)
    if spill_s:
        I = I + glow(cx - FIRE_SPILL, by + 70, spill_r, spill_s, 0.4)
    return L, I


def build(item, place):
    kind = ITEMS[item][1]
    if place == "ceiling":
        return build_chandelier(item)
    if place in LEDGES:
        return build_ledge(item, place)
    if place in STANDS:
        return build_standing(item, place)
    if place == "fireplace":
        return build_fire()
    if place in WALLS:
        return build_wall(item, place)
    if place == "cloth":
        return build_cloth(item)
    if place == "settings":
        return build_settings(item)
    if place in TREATS:
        return build_treat(item, place)
    if place == "corner":
        return build_gramophone()
    raise ValueError((item, place, kind))


# ---------------------------------------------------------------- the phone room
if PHONE:
    # Measured on room-portrait.jpg (944 x 1888), redrawn 2026-10-14: the
    # fireplace in the middle of the back wall, the table pointing at it, three
    # chairs a side. The table's sides meet at (468, 1166).
    VANISH = (468, 1166)
    # The chandelier hangs high, as on the computer (Lena, 2026-10-16): the
    # chain is cut here and the chain below it and the hook are painted out.
    CHAIN_END = (474, 400)
    HOOK_CUT = [(408, 650, 462, 490, 30), (640, round(phone_y(762)) + 4, 446, 502, 64)]
    CHANDELIER_SCALE = 0.95
    TABLE = [(343, 1312), (594, 1312), (858, 1621), (79, 1621)]
    TABLE_POOL = (468, 1460, 300)
    # From the perspective (the near edge is 3.1 times wider than the far one)
    # and the chairs: about three and a half widths long, the chairs in its
    # nearer half, the centre piece further back towards the fireplace.
    TABLE_LEN = 3.65
    SEATS_V = [1.93, 1.12, 0.32]
    PLATE_W = 0.34
    CENTRE_PIECE = (0.50, 1.93, 0.62)
    TREATS = {"treatFront": (0.50, 0.32, 0.22), "treatMiddle": (0.50, 1.12, 0.22)}
    TABLE_H = homography([(0, 0), (1, 0), (1, TABLE_LEN), (0, TABLE_LEN)],
                         [TABLE[3], TABLE[2], TABLE[1], TABLE[0]])
    WALLS = {   # the empty stone panels on each side of the fireplace, and one on the right wall
        "wallBackLeft": [(177, 809), (286, 809), (286, 1023), (177, 1023)],
        "wallBackRight": [(662, 809), (782, 809), (782, 1023), (662, 1023)],
        # the panel on the right side wall, seen at an angle (Lena, 2026-10-14)
        "wallRight": [(869, 822), (934, 792), (934, 1097), (869, 1085)],
    }
    STANDS = {"tableCentre": (0, 0, 0, 0.66)}
    CLOTH = {
        "top": [(337, 1307), (600, 1307), (866, 1626), (71, 1626)],
        "drop": (71, 1624, 795, 105),
        "rows": (1300, 1740),
        "ref": (1400, 1600, 300, 640),
    }
    GRAMOPHONE = (848, 805, 125)        # wall plate on the right wall, by the corner
    # The mantel faces us across the back wall, above eye level: feet hide
    # behind its front edge, a level line.

    def mantel_edge(x):
        return phone_y(1005) + 0 * np.asarray(x, float)

    LEDGES = {"mantel": (475, mantel_edge, 150, 0.60)}
    LEDGE_GLOW = {"mantel": 150}
    LEDGE_SHADOW = (0, 3)               # the chimney faces us: the shadow falls straight behind
    LEDGE_SIDE_FILE = {k: ITEMS[k][0] for k in LEDGE_SIDE_FILE}   # face on, as in the Emporium
    # A wide, low fire from side to side of the hearth, and its light kept
    # in the fireplace — it warms, it doesn't light the table (Lena, 2026-10-16).
    FIRE = (480, round(phone_y(1294)), 150)
    FIRE_SPREAD = (112, 1.0)
    FIRE_LIGHT = (110, 0.07, 0, 0)
    FIRE_INSIDE = 0.24
    FIRE_HEARTH = 26
    FIRE_SPILL = 0                      # the fire faces the room: its spill comes straight towards us
    FIRE_OPENING = [(x, round(phone_y(y))) for x, y in
                    [(390, 1302), (390, 1118), (410, 1102), (478, 1094), (548, 1102), (571, 1118), (571, 1302)]]

    def _py(box):
        return tuple(v if i % 2 == 0 else round(phone_y(v)) for i, v in enumerate(box))

    ANDIRONS = [
        ("ellipse", _py((419, 1214, 430, 1228))), ("rect", _py((421, 1226, 427, 1284))),
        ("poly", [_py(p) for p in [(420, 1280), (428, 1280), (443, 1302), (437, 1303), (424, 1288), (410, 1303), (404, 1302)]]),
        ("ellipse", _py((528, 1217, 539, 1231))), ("rect", _py((530, 1229, 536, 1284))),
        ("poly", [_py(p) for p in [(529, 1280), (537, 1280), (553, 1302), (547, 1303), (533, 1288), (519, 1303), (513, 1302)]]),
    ]
    for _p in ("wallLeft", "wallBackCentre", "shelf"):
        PLACES.pop(_p, None)
    ORDER = [p for p in ORDER if p in PLACES]


# ---------------------------------------------------------------- run
def main(preview_choice=None):
    os.makedirs(os.path.join(OUT, "patches"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "lights"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "icons"), exist_ok=True)
    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
    room.save(os.path.join(OUT, "room.webp"), quality=86)

    for item, (f, kind, _) in ITEMS.items():
        if PHONE:
            break                      # icons are shared with the computer room
        if item in ICON_FILE:
            ic = cut_out(ICON_FILE[item])
            ic.thumbnail((256, 256), Image.LANCZOS)
        elif kind == "cloth":
            ic = Image.open(os.path.join(ITEMS_DIR, f)).convert("RGBA").resize((256, 256), Image.LANCZOS)
        elif kind == "fire":
            continue
        else:
            ic = cut_out(f)
            ic.thumbnail((256, 256), Image.LANCZOS)
        ic.save(os.path.join(OUT, "icons", f"{item}.webp"), quality=88)

    data = {"width": W, "height": H, "order": ORDER, "places": {}}
    built = {}
    for place in ORDER:
        data["places"][place] = {}
        for item in PLACES[place]:
            L, I = build(item, place)
            box = L.box()
            patch = L.im.crop(box)
            name = f"{item}--{place}"
            patch.save(os.path.join(OUT, "patches", f"{name}.webp"), quality=88)
            entry = {"x": box[0], "y": box[1], "w": box[2] - box[0], "h": box[3] - box[1]}
            if I is not None:
                li = light_layer(I)
                lb = li.getbbox()
                li.crop(lb).save(os.path.join(OUT, "lights", f"{name}.webp"), quality=82)
                entry["light"] = {"x": lb[0], "y": lb[1], "w": lb[2] - lb[0], "h": lb[3] - lb[1]}
            data["places"][place][item] = entry
            built[(item, place)] = (L, I)
            print("built", name)
    with open(JSON_OUT, "w") as fh:
        json.dump(data, fh, indent=1)

    # one decorated room
    choice = preview_choice or {
        "wallLeft": "paintingCastle", "wallBackLeft": "paintingRaven",
        "wallBackCentre": "mirrorGilt", "wallBackRight": "paintingLady",
        "wallRight": "mirrorGhost", "shelf": "candlesSkull",
        "mantel": "candelabraSilver", "ceiling": "chandelierIron",
        "corner": "gramophone", "cloth": "clothRedVelvet", "fireplace": "firewood",
        "settings": "settingSilver", "tableCentre": "vaseLilies",
        "treatFront": "treatPie", "treatMiddle": "treatCake",
    }
    img = room.convert("RGBA")
    light = np.zeros((H, W))
    for place in ORDER:
        if place not in choice:
            continue
        L, I = built[(choice[place], place)]
        img = Image.alpha_composite(img, L.im)
        if I is not None:
            light = light + I
    final = screen(img.convert("RGB"), light_layer(light))
    final.save(os.path.join(SRC, f"_castle{SUFFIX}-preview.png"))

    # contact sheet: every item in every place, cropped around the place
    tiles = []
    for place in ORDER:
        for item in PLACES[place]:
            L, I = built[(item, place)]
            im = Image.alpha_composite(room.convert("RGBA"), L.im).convert("RGB")
            if I is not None:
                im = screen(im, light_layer(I))
            x0, y0, x1, y1 = L.box()
            pad = 30
            crop = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)))
            crop.thumbnail((240, 240))
            tile = Image.new("RGB", (250, 270), (14, 12, 24))
            tile.paste(crop, ((250 - crop.width) // 2, 5))
            ImageDraw.Draw(tile).text((6, 252), f"{item} / {place}", fill=(230, 210, 170))
            tiles.append(tile)
    cols = 10
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 250, rows * 270), (8, 6, 14))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * 250, (i // cols) * 270))
    sheet.save(os.path.join(SRC, f"_castle{SUFFIX}-contact.png"))
    print(len(tiles), "patches")


if __name__ == "__main__":
    main()
