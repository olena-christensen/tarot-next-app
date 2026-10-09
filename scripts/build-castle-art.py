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


ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
SRC = os.path.join(ROOT, "game-art-source")
ITEMS_DIR = os.path.join(SRC, "castle")
OUT = os.path.join(ROOT, "public", "game-art", "castle")
JSON_OUT = os.path.join(ROOT, "src", "lib", "castleGame", "places.generated.json")

room = Image.open(os.path.join(SRC, "castle-room.png")).convert("RGB")
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
    "candelabraSilver": ("grand-silver3.png", "standing", True),
    "candelabraBlackWax": ("grand-black5.png", "standing", True),
    "candelabraSkull": ("grand-skulls.png", "standing", True),
    "candelabraSilverFive": ("grand-silver5.png", "standing", True),
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
CHAIN_END = (797, 58)          # chandelier hangs here once the hook is gone
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
# Down the middle of the table, clear of the plates. The centre piece stands
# furthest back so the two treats in front of it never hide it.
CENTRE_PIECE = (0.50, 0.95, 0.62)      # u, v, height in table-widths
TREATS = {"treatFront": (0.50, 0.15, 0.22), "treatMiddle": (0.50, 0.55, 0.22)}   # u, v, width
GRAMOPHONE = (100, 578, 150)           # base on the side table's top
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


LEDGE_SIDE_FILE = {k: ITEMS[k][0] for k in ("candelabraSilver", "candelabraBlackWax",
                                            "candelabraSkull", "candelabraSilverFive")}
LEDGES = {"shelf": (1262, shelf_edge, 125, 0.55), "mantel": (1440, mantel_edge, 180, 0.60)}
FIRE = (1463, 683, 116)                # centre x, base y, width: middle of the fireplace

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
def hook_cover():
    """The room's own wall, shifted sideways, painted over the hook."""
    cut = np.zeros((H, W)); cut[60:198, 774:822] = 1
    cut = ndimage.gaussian_filter(cut, 3)
    src = np.roll(RA, 48, axis=1)
    return Image.fromarray(np.dstack([src, cut * 255]).astype(np.uint8), "RGBA")


def build_chandelier(item):
    sp = cut_out(ITEMS[item][0])
    width = {"chandelierIron": 300, "chandelierAntler": 300, "chandelierCrystal": 250}[item]
    sp = moonlight(resize_w(sp, width), 0.70, True)
    L = Layer()
    L.im = Image.alpha_composite(L.im, hook_cover())
    x0, y0 = CHAIN_END[0] - sp.width / 2, CHAIN_END[1] - 4
    L.paste(sp, x0, y0)
    halo, c = flame_halos(sp, x0, y0, 14, 0.30)
    I = halo + glow(c[0], c[1], 300, 0.42) + glow(c[0], c[1], 110, 0.20) \
        + glow(792, 600, 230, 0.22, 0.45)          # pool of light on the table
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
    if flat:
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


def build_cloth(item):
    tex = Image.open(os.path.join(ITEMS_DIR, ITEMS[item][0])).convert("RGB")
    tex = tex.resize((800, 800), Image.LANCZOS)
    t = np.asarray(tex).astype(float)
    # table top: the cloth hangs a little over the edges
    top_q = [(650, 503), (932, 503), (1180, 744), (402, 744)]
    top = tex.resize((800, 1100))
    L = Layer()
    L.im = Image.alpha_composite(L.im, warp_to_quad(Image.fromarray(t.astype(np.uint8)).convert("RGBA"), top_q))
    # front drop with a wavy hem
    drop = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    strip = tex.crop((0, 0, 800, 200)).resize((780, 125)).convert("RGBA")
    sa = np.asarray(strip).astype(float)
    # folds: darker bands
    xs = np.arange(sa.shape[1])
    fold = 0.78 + 0.22 * np.cos(xs / 780 * np.pi * 14) ** 2
    sa[..., :3] *= fold[None, :, None] * 0.55   # the drop faces us, away from the light
    hem = 112 + 9 * np.sin(xs / 780 * np.pi * 14)
    rows = np.arange(sa.shape[0])[:, None]
    sa[..., 3] = np.where(rows < hem[None, :], 255, 0)
    drop.paste(Image.fromarray(sa.astype(np.uint8), "RGBA"), (401, 742))
    L.im = Image.alpha_composite(L.im, drop)
    L.im = moonlight(L.im, 0.55)
    # the table's own shading (light pool, edges) shows through the cloth
    shade = RA.mean(2)
    tm = np.asarray(L.im).astype(float)
    ref = np.percentile(shade[520:740, 600:980], 60)
    k = np.clip(shade / max(ref, 1), 0.55, 1.35)[..., None]
    region = np.zeros((H, W), bool); region[500:745, :] = True
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


def build_settings(item):
    plate_f, goblet_f = ITEMS[item][0]
    plate = moonlight(cut_out(plate_f), 0.66)
    goblet = cut_out(goblet_f)
    L = Layer()
    goblets = []
    for v in SEATS_V:
        for u0, facing in ((0.16, 1), (0.84, -1)):
            L.im = Image.alpha_composite(L.im, lay_flat(plate, u0, v, 0.40, facing))
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
    """Horn turned towards the room."""
    cx, by, h = GRAMOPHONE
    sp = cut_out(ITEMS["gramophone"][0]).transpose(Image.FLIP_LEFT_RIGHT)
    L, _, _ = standing(sp, cx, by, h, False, 0.66)
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
        L.paste(shadow, cx - spr.width / 2 - 9, top - 3)
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
        I = halo + glow(c[0], c[1] - 10, {"shelf": 150, "mantel": 180}[place], 0.17)
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
    # andirons in front, taken from the room itself
    m = Image.new("L", (W, H), 0); d = ImageDraw.Draw(m)
    for kind, geo in ANDIRONS:
        {"ellipse": d.ellipse, "rect": d.rectangle, "poly": d.polygon}[kind](geo, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(0.7))
    andiron = room.convert("RGBA"); andiron.putalpha(m)
    L.im = Image.alpha_composite(L.im, andiron)
    # light: the flames themselves (soft, see-through), the glowing inside of
    # the fireplace, and the warm spill into the room
    F = np.zeros((H, W))
    F[y0:y0 + im.height, x0:x0 + im.width] = flame * (mx / 255)
    F = F * 0.25 + ndimage.gaussian_filter(F, 12) * 0.9
    inside = Image.new("L", (W, H), 0)
    ImageDraw.Draw(inside).polygon(FIRE_OPENING, fill=255)
    inside = np.asarray(inside.filter(ImageFilter.GaussianBlur(8))) / 255
    I = F + inside * glow(cx, by - 30, 110, 0.40, 1.2) \
        + glow(cx, by - 40, 300, 0.20, 0.9) + glow(cx - 100, by + 70, 230, 0.14, 0.4)
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


# ---------------------------------------------------------------- run
def main(preview_choice=None):
    os.makedirs(os.path.join(OUT, "patches"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "lights"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "icons"), exist_ok=True)
    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
    room.save(os.path.join(OUT, "room.webp"), quality=86)

    for item, (f, kind, _) in ITEMS.items():
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
    final.save(os.path.join(SRC, "_castle-preview.png"))

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
    sheet.save(os.path.join(SRC, "_castle-contact.png"))
    print(len(tiles), "patches")


if __name__ == "__main__":
    main()
