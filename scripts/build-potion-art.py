#!/usr/bin/env python3
"""
Builds the art for "Brew the Potion" (the hidden-object game).

Reads the full-size source pictures in game-art-source/ and writes:
  public/game-art/potion/room.webp            the room
  public/game-art/potion/sprites/<id>.webp    clean ingredient pictures (recipe icons, flying item)
  public/game-art/potion/patches/<id>--<spot>.webp
        one transparent patch per ingredient-in-spot: the ingredient already
        darkened to the room's light, with its shadow, and with any scene object
        that should cover it painted back on top. The game lays a patch over the
        room at its x/y — no masking in the browser.
  src/lib/potionGame/spots.generated.json      positions and tap boxes

Run from the repository root:  python3 scripts/build-potion-art.py
Needs Pillow and numpy only.

To add a hiding spot or ingredient: add it to SPOTS / INGREDIENTS below, run the
script, look at the contact sheet it writes (game-art-source/_contact.png).
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
SRC = os.path.join(ROOT, "game-art-source")
OUT = os.path.join(ROOT, "public", "game-art", "potion")
JSON_OUT = os.path.join(ROOT, "src", "lib", "potionGame", "spots.generated.json")

room = Image.open(os.path.join(SRC, "room.png")).convert("RGBA")
W, H = room.size
R = np.asarray(room.convert("RGB")).astype(int)


def load(name):
    im = Image.open(os.path.join(SRC, name)).convert("RGBA")
    return im.crop(im.getbbox())


SPRITES = {
    "batEye": load("bat-eye.png"),
    "frogTongue": load("frog-tongue.png"),
    "dragonTear": load("dragon-tear.png"),
    "ravenFeather": load("raven-feather.png"),
    "spider": load("spider.png"),
    "toadstool": load("toadstool.png"),
    "newtTail": load("newt-tail.png"),
    # Second batch (2026-10-06), made in Canva like the first.
    "magicFlower": load("magic-flower.png"),
    "fairyDust": load("fairy-dust.png"),
    "deadFinger": load("dead-finger.png"),
    "creatureClaw": load("creature-claw.png"),
    "trollEar": load("troll-ear.png"),
    "lizard": load("lizard.png"),
    "butterflyWing": load("butterfly-wing.png"),
    "snowflake": load("snowflake.png"),
}

# The round eyeball of the bat eye, without its wing — for the herb bunch and
# the skull socket, where it stares out at the player.
_b = SPRITES["batEye"]
_cx, _cy, _r = int(_b.width * 0.30), int(_b.height * 0.665), int(_b.width * 0.30)
EYEBALL = _b.crop((_cx - _r, _cy - _r, _cx + _r, _cy + _r))
_m = Image.new("L", EYEBALL.size, 0)
ImageDraw.Draw(_m).ellipse([0, 0, 2 * _r, 2 * _r], fill=255)
EYEBALL.putalpha(ImageChops.multiply(EYEBALL.getchannel("A"), _m))


# ---------- occluders: scene pixels painted back over the ingredient ----------
def color_mask(fn, box):
    x0, y0, x1, y1 = box
    m = np.zeros((H, W), bool)
    sub = R[y0:y1, x0:x1]
    m[y0:y1, x0:x1] = fn(sub[..., 0], sub[..., 1], sub[..., 2])
    return Image.fromarray((m * 255).astype("uint8"), "L")


def shape_mask(*shapes):
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    for kind, box in shapes:
        (d.ellipse if kind == "ellipse" else d.rectangle)(box, fill=255)
    return m


OCC = {
    "leaves": color_mask(lambda r, g, b: (g > r + 8) & (g > b + 12), (430, 110, 570, 335)),
    "tableBottles": color_mask(lambda r, g, b: (r + g + b) > 150, (600, 500, 760, 600)),
    "topBottle": shape_mask(("ellipse", (722, 238, 802, 306)), ("rect", (741, 208, 771, 246))),
    "pot": shape_mask(("ellipse", (18, 616, 130, 702))),
    "benchLeg": shape_mask(("rect", (487, 640, 545, 800))),
    "crateFront": shape_mask(("rect", (1236, 793, 1510, 905))),
    "bristles": color_mask(lambda r, g, b: (r > g) & (g > b) & ((r + g + b) > 170), (180, 694, 320, 770)),
    "garlic": color_mask(lambda r, g, b: (r + g + b) > 420, (330, 110, 420, 310)),
}
# Bottles on the three shelves: anything brighter than the dark wall behind
# them is painted back, so an ingredient tucked between bottles only shows in
# the gap. The middle shelf's mask also catches the cauldron's steam.
OCC["shelf1"] = color_mask(lambda r, g, b: (r + g + b) > 150, (560, 150, 1280, 304))
OCC["shelf2"] = color_mask(lambda r, g, b: (r + g + b) > 150, (560, 330, 1060, 458))
# The green bottle on the left end of the table, and the big purple bottle on
# the floor by the barrel.
OCC["benchBottle"] = shape_mask(("ellipse", (339, 541, 393, 599)), ("rect", (350, 510, 383, 545)))
OCC["bigBottle"] = shape_mask(("ellipse", (166, 800, 288, 916)), ("rect", (202, 740, 250, 810)))
# The plant pot: its rim and body in front of whatever grows in the soil, and
# the leaves in front of that.
OCC["potSoil"] = ImageChops.lighter(
    shape_mask(("rect", (12, 631, 142, 712))),
    color_mask(lambda r, g, b: (g > r + 8) & (g > b + 12), (0, 470, 200, 640)),
)
# The stone mortar on the table: its bowl in front of what lies inside.
OCC["mortar"] = shape_mask(("rect", (910, 560, 1004, 606)))
# The leaves of the plant reach over the left end of the window sill.
OCC["sillLeaves"] = color_mask(lambda r, g, b: (g > r + 8) & (g > b + 12), (0, 470, 160, 560))
# The eye in the herbs keeps its pupil uncovered.
_hole = shape_mask(("ellipse", (498 - 7, 232 - 12, 498 + 7, 232 + 12)))
OCC["leavesEye"] = ImageChops.subtract(OCC["leaves"], _hole)
# The eyeball in the skull only shows inside the dark socket.
CLIP_SOCKET = ImageChops.multiply(
    shape_mask(("ellipse", (1068, 557, 1099, 589))),
    color_mask(lambda r, g, b: (r + g + b) < 330, (1060, 550, 1106, 596)),
)
CLIP_SOCKET_LEFT = ImageChops.multiply(
    shape_mask(("ellipse", (1029, 553, 1053, 584))),
    color_mask(lambda r, g, b: (r + g + b) < 330, (1024, 548, 1058, 590)),
)
CLIPS = {True: CLIP_SOCKET, "right": CLIP_SOCKET, "left": CLIP_SOCKET_LEFT}

# ---------- hiding spots ----------
# spot id -> {ingredient: (height px, rotation deg, brightness, cx, bottom, extras)}
# extras: occ=<OCC key>, clip=True|"left" (skull eye socket), shadow=False,
#         contact=True (standing on a surface: oval shadow under it, no side shadow),
#         shade=(left,right) brightness ramp,
#         eyeball=True (use the round eye without its wing)
SPOTS = {
    "herbs":        {"batEye": (34, 0, .80, 498, 249, dict(eyeball=True, occ="leavesEye", shadow=False))},
    "skull":        {"batEye": (30, 0, .90, 1084, 588, dict(eyeball=True, clip=True, shadow=False)),
                     "spider": (26, 0, .95, 1084, 590, dict(clip=True, shadow=False))},
    "skullLeft":    {"batEye": (24, 0, .90, 1041, 581, dict(eyeball=True, clip="left", shadow=False)),
                     "spider": (22, 0, .95, 1041, 584, dict(clip="left", shadow=False))},
    "potSoil":      {"toadstool": (40, 0, .80, 92, 640, dict(occ="potSoil", contact=True)),
                     "ravenFeather": (66, 18, .80, 100, 640, dict(occ="potSoil", shadow=False))},
    "mortar":       {"frogTongue": (50, -30, .80, 936, 572, dict(occ="mortar", shadow=False)),
                     "newtTail": (36, 0, .80, 936, 572, dict(occ="mortar", shadow=False)),
                     "toadstool": (34, 0, .80, 936, 572, dict(occ="mortar", shadow=False))},
    "shelf1Gap":    {"newtTail": (34, 0, .75, 790, 302, dict(occ="shelf1", contact=True)),
                     "spider": (28, 0, .75, 790, 302, dict(occ="shelf1", contact=True)),
                     "dragonTear": (40, 0, .75, 790, 302, dict(occ="shelf1", contact=True))},
    "shelf2Left":   {"toadstool": (36, 0, .75, 695, 455, dict(occ="shelf2", contact=True)),
                     "dragonTear": (44, 0, .75, 695, 455, dict(occ="shelf2", contact=True))},
    "benchBottle":  {"toadstool": (40, 0, .78, 330, 600, dict(occ="benchBottle", contact=True)),
                     "ravenFeather": (66, 12, .80, 328, 600, dict(occ="benchBottle", contact=True)),
                     "spider": (32, 0, .78, 330, 600, dict(occ="benchBottle", contact=True))},
    "floorBottle":  {"newtTail": (40, 0, .80, 292, 918, dict(occ="bigBottle", contact=True)),
                     "frogTongue": (58, -78, .80, 296, 918, dict(occ="bigBottle", contact=True)),
                     "batEye": (46, 10, .80, 290, 918, dict(occ="bigBottle", contact=True))},
    "shelf2Right":  {"newtTail": (34, 0, .75, 897, 455, dict(occ="shelf2", contact=True)),
                     "toadstool": (36, 0, .75, 897, 455, dict(occ="shelf2", contact=True)),
                     "dragonTear": (44, 0, .75, 897, 455, dict(occ="shelf2", contact=True))},
    "benchFloor":   {"frogTongue": (64, -82, .80, 455, 796, dict(occ="benchLeg", shade=(.35, .6))),
                     "newtTail": (40, 0, .55, 440, 798, dict(occ="benchLeg")),
                     "spider": (38, 0, .55, 450, 798, dict(occ="benchLeg"))},
    "tableBottles": {"frogTongue": (56, 8, .75, 676, 598, dict(occ="tableBottles")),
                     "toadstool": (40, 0, .75, 677, 598, dict(occ="tableBottles"))},
    "topShelf":     {"frogTongue": (62, -84, .72, 694, 306, dict(occ="topBottle")),
                     "ravenFeather": (70, -74, .80, 690, 306, dict(occ="topBottle")),
                     "newtTail": (40, 0, .75, 692, 306, dict(occ="topBottle"))},
    "barrel":       {"frogTongue": (56, 75, .72, 122, 704, dict(occ="pot")),
                     "toadstool": (42, 0, .75, 132, 706, dict(occ="pot")),
                     "spider": (36, 0, .72, 134, 704, dict(occ="pot"))},
    "candle":       {"dragonTear": (72, 0, .85, 1275, 640, {}),
                     "toadstool": (46, 0, .85, 1272, 640, {}),
                     "newtTail": (38, 0, .85, 1272, 640, {})},
    "web":          {"spider": (46, 0, .80, 128, 178, dict(shadow=False))},
    "lantern":      {"spider": (34, 0, .80, 1418, 366, {})},
    "broom":        {"ravenFeather": (74, 14, .78, 250, 712, dict(occ="bristles"))},
    "crate":        {"frogTongue": (70, 0, .78, 1300, 806, dict(occ="crateFront")),
                     "ravenFeather": (82, -10, .78, 1302, 812, dict(occ="crateFront")),
                     "newtTail": (46, 0, .78, 1300, 806, dict(occ="crateFront")),
                     "batEye": (52, 15, .78, 1298, 806, dict(occ="crateFront"))},
    "floorLeft":    {"frogTongue": (64, 12, .80, 488, 935, {}),
                     "toadstool": (48, 0, .80, 488, 935, {}),
                     "newtTail": (46, 0, .80, 488, 935, {}),
                     "dragonTear": (60, 0, .80, 488, 935, {})},
    "floorSack":    {"toadstool": (44, 0, .75, 1098, 905, {}),
                     "spider": (38, 0, .70, 1098, 905, {}),
                     "dragonTear": (58, 0, .75, 1098, 905, {})},
    "books":        {"newtTail": (34, 0, .80, 1168, 391, dict(contact=True)),
                     "ravenFeather": (70, -80, .80, 1175, 391, dict(contact=True)),
                     "dragonTear": (46, 0, .80, 1200, 391, dict(contact=True))},
    "sill":         {"batEye": (48, 0, .75, 160, 516, dict(contact=True)),
                     "toadstool": (40, 0, .75, 160, 516, dict(contact=True)),
                     "spider": (34, 0, .72, 160, 516, dict(contact=True)),
                     "dragonTear": (50, 0, .75, 162, 516, dict(contact=True))},
    "garlic":       {"batEye": (44, -8, .80, 368, 262, dict(occ="garlic")),
                     "spider": (36, 0, .80, 378, 340, dict(thread=34))},
}


# Where the second batch of ingredients hides, added to the spots above (same
# spec format). Kept apart so the first batch's numbers stay untouched.
MORE = {
    "benchFloor":   {"lizard": (40, 0, .60, 448, 798, dict(occ="benchLeg")),
                     "trollEar": (44, 0, .55, 448, 798, dict(occ="benchLeg"))},
    "tableBottles": {"magicFlower": (48, 0, .75, 677, 598, dict(occ="tableBottles")),
                     "snowflake": (40, 0, .75, 677, 596, dict(occ="tableBottles"))},
    "topShelf":     {"butterflyWing": (50, -10, .75, 692, 306, dict(occ="topBottle")),
                     "fairyDust": (40, 0, .75, 692, 306, dict(occ="topBottle"))},
    "barrel":       {"lizard": (36, 0, .72, 132, 704, dict(occ="pot"))},
    "candle":       {"fairyDust": (44, 0, .85, 1272, 640, {}),
                     "snowflake": (38, 0, .85, 1272, 640, {}),
                     "deadFinger": (60, -70, .85, 1274, 640, {})},
    "web":          {"butterflyWing": (46, 15, .80, 128, 180, dict(shadow=False)),
                     "snowflake": (40, 0, .85, 128, 176, dict(shadow=False))},
    "lantern":      {"snowflake": (30, 0, .85, 1418, 366, {})},
    "broom":        {"creatureClaw": (56, 20, .78, 250, 712, dict(occ="bristles")),
                     "deadFinger": (62, 60, .78, 250, 712, dict(occ="bristles"))},
    "crate":        {"trollEar": (52, 0, .78, 1300, 806, dict(occ="crateFront")),
                     "lizard": (46, 0, .78, 1300, 806, dict(occ="crateFront")),
                     "creatureClaw": (60, 0, .78, 1300, 808, dict(occ="crateFront"))},
    "floorLeft":    {"lizard": (44, 0, .80, 488, 935, {}),
                     "trollEar": (50, 0, .80, 488, 935, {}),
                     "deadFinger": (64, -70, .80, 488, 935, {}),
                     "creatureClaw": (58, 20, .80, 488, 935, {})},
    "floorSack":    {"fairyDust": (50, 0, .75, 1098, 905, {}),
                     "deadFinger": (60, -80, .75, 1098, 905, {}),
                     "magicFlower": (52, 0, .75, 1098, 905, {})},
    "books":        {"butterflyWing": (40, -20, .80, 1170, 391, dict(contact=True)),
                     "deadFinger": (54, -80, .80, 1172, 391, dict(contact=True)),
                     "creatureClaw": (48, -60, .80, 1172, 391, dict(contact=True))},
    "sill":         {"magicFlower": (46, 0, .75, 160, 516, dict(contact=True)),
                     "snowflake": (40, 0, .80, 160, 516, dict(contact=True)),
                     "butterflyWing": (40, 0, .75, 160, 516, dict(contact=True))},
    "garlic":       {"trollEar": (40, -8, .80, 368, 262, dict(occ="garlic"))},
    "potSoil":      {"magicFlower": (54, 0, .80, 94, 642, dict(occ="potSoil", contact=True))},
    "mortar":       {"fairyDust": (40, 0, .80, 936, 574, dict(occ="mortar", shadow=False)),
                     "snowflake": (32, 0, .80, 936, 572, dict(occ="mortar", shadow=False)),
                     "creatureClaw": (46, -30, .80, 936, 572, dict(occ="mortar", shadow=False))},
    "shelf1Gap":    {"fairyDust": (36, 0, .75, 790, 302, dict(occ="shelf1", contact=True)),
                     "trollEar": (36, 0, .75, 790, 302, dict(occ="shelf1", contact=True))},
    "shelf2Left":   {"magicFlower": (44, 0, .75, 695, 455, dict(occ="shelf2", contact=True)),
                     "creatureClaw": (44, -20, .75, 695, 455, dict(occ="shelf2", contact=True))},
    "shelf2Right":  {"trollEar": (38, 0, .75, 897, 455, dict(occ="shelf2", contact=True)),
                     "butterflyWing": (40, 0, .75, 897, 455, dict(occ="shelf2", contact=True))},
    "benchBottle":  {"magicFlower": (48, 0, .78, 330, 600, dict(occ="benchBottle", contact=True)),
                     "lizard": (36, 0, .78, 330, 600, dict(occ="benchBottle", contact=True)),
                     "snowflake": (34, 0, .80, 330, 600, dict(occ="benchBottle", contact=True))},
    "floorBottle":  {"trollEar": (44, 0, .80, 292, 918, dict(occ="bigBottle", contact=True)),
                     "butterflyWing": (40, 0, .80, 292, 918, dict(occ="bigBottle", contact=True))},
}
for _spot, _ings in MORE.items():
    SPOTS[_spot].update(_ings)


def prep(im, h, rot, dark):
    w = max(1, int(im.width * h / im.height))
    im = im.resize((w, h), Image.LANCZOS)
    if rot:
        im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
        # Rotating leaves empty corners; trim them so "bottom" is where the
        # thing really touches the surface, not an invisible corner below it.
        im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())
    a = im.getchannel("A")
    rgb = ImageEnhance.Brightness(im.convert("RGB")).enhance(dark)
    r, g, b = rgb.split()
    r = r.point(lambda x: min(255, int(x * 1.04)))   # warm, to match candlelight
    b = b.point(lambda x: int(x * 0.9))
    out = Image.merge("RGB", (r, g, b)).convert("RGBA")
    out.putalpha(a)
    return out


def shade(im, left, right):
    arr = np.asarray(im).astype(float)
    f = np.linspace(left, right, im.width)[None, :, None]
    arr[..., :3] *= f
    return Image.fromarray(arr.clip(0, 255).astype("uint8"), "RGBA")


def render(ing, spot, spec):
    h, rot, dark, cx, bottom, ex = spec
    src = EYEBALL if ex.get("eyeball") else SPRITES[ing]
    im = prep(src, h, rot, dark)
    if "shade" in ex:
        im = shade(im, *ex["shade"])
    x, y = int(cx - im.width / 2), int(bottom - im.height)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if ex.get("thread"):  # a spider hanging on its thread
        ImageDraw.Draw(layer).line([cx, y - ex["thread"], cx, y + im.height // 3], fill=(205, 200, 225, 170), width=1)
    layer.alpha_composite(im, (x, y))
    if ex.get("clip"):
        layer.putalpha(ImageChops.multiply(layer.getchannel("A"), CLIPS[ex["clip"]]))
    canvas = room.copy()
    if ex.get("contact"):
        # Standing on a surface: a soft dark oval right under the base, so the
        # thing sits ON the ledge instead of hovering in front of it.
        cw = int(im.width * 0.9)
        sh = Image.new("L", (W, H), 0)
        ImageDraw.Draw(sh).ellipse([cx - cw // 2, bottom - 4, cx + cw // 2, bottom + 4], fill=150)
        sh = sh.filter(ImageFilter.GaussianBlur(3))
        dark = Image.new("RGBA", (W, H), (10, 0, 15, 0))
        dark.putalpha(sh)
        canvas.alpha_composite(dark)
    elif ex.get("shadow", True):
        sh = Image.new("RGBA", (W, H), (10, 0, 15, 0))
        sh.putalpha(layer.getchannel("A").point(lambda v: int(v * 0.5)))
        sh = ImageChops.offset(sh.filter(ImageFilter.GaussianBlur(4)), 4, 4)
        canvas.alpha_composite(sh)
    canvas.alpha_composite(layer)
    if ex.get("occ"):
        canvas.paste(room, (0, 0), OCC[ex["occ"]].filter(ImageFilter.GaussianBlur(0.8)))
    # Patch = only the pixels that changed, so patches never hide each other.
    diff = np.abs(np.asarray(canvas).astype(int) - np.asarray(room).astype(int)).sum(axis=2)
    changed = Image.fromarray(((diff > 3) * 255).astype("uint8"), "L").filter(ImageFilter.MaxFilter(3))
    bbox = changed.getbbox()
    patch = canvas.crop(bbox)
    patch.putalpha(changed.crop(bbox))
    # Tap box: the visible part of the ingredient itself, padded.
    vis = layer.getchannel("A")
    if ex.get("occ"):
        vis = ImageChops.subtract(vis, OCC[ex["occ"]])
    vb = vis.point(lambda v: 255 if v > 40 else 0).getbbox() or bbox
    return patch, bbox, vb


def main():
    os.makedirs(os.path.join(OUT, "patches"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "sprites"), exist_ok=True)
    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)

    room.convert("RGB").save(os.path.join(OUT, "room.webp"), quality=86, method=6)
    for ing, im in SPRITES.items():
        s = im.copy()
        s.thumbnail((192, 192), Image.LANCZOS)
        s.save(os.path.join(OUT, "sprites", f"{ing}.webp"), quality=90, method=6)

    # The finished potion: end screen, the friend's page, the main-page way in
    # (webp), and the link-preview picture for Messenger/Facebook/Slack (png —
    # the preview renderer can't read webp).
    bottle_src = os.path.join(SRC, "potion-bottle.png")
    if os.path.exists(bottle_src):
        b = load("potion-bottle.png")
        b.thumbnail((600, 800), Image.LANCZOS)
        b.save(os.path.join(OUT, "bottle.webp"), quality=90, method=6)
        b.save(os.path.join(OUT, "bottle.png"), optimize=True)
        # Link-preview picture for shared potions: only the bottle, centred, on
        # the dark glow — words live in the link's title/description instead
        # (Lena, 2026-10-06). Centred so Slack's small square crop is clean.
        card = Image.new("RGB", (1200, 630), (11, 8, 16))
        glow = Image.new("L", card.size, 0)
        ImageDraw.Draw(glow).ellipse([600 - 330, 315 - 330, 600 + 330, 315 + 330], fill=150)
        glow = glow.filter(ImageFilter.GaussianBlur(110))
        card = Image.composite(Image.new("RGB", card.size, (110, 230, 70)), card, glow.point(lambda v: int(v * 0.45)))
        bb = b.copy()
        bb.thumbnail((360, 560), Image.LANCZOS)
        halo = Image.new("L", (bb.width + 160, bb.height + 160), 0)
        halo.paste(bb.getchannel("A"), (80, 80))
        halo = halo.filter(ImageFilter.GaussianBlur(26)).point(lambda v: int(v * 0.6))
        green = Image.new("RGBA", halo.size, (150, 255, 90, 0))
        green.putalpha(halo)
        card = card.convert("RGBA")
        x, y = (1200 - bb.width) // 2, (630 - bb.height) // 2
        card.alpha_composite(green, (x - 80, y - 80))
        card.alpha_composite(bb, (x, y))
        card.convert("RGB").save(os.path.join(OUT, "share-card.png"), optimize=True)
    else:
        print("note: game-art-source/potion-bottle.png missing — bottle not built")

    data = {"width": W, "height": H, "cauldron": {"x": 785, "y": 690}, "spots": {}}
    sheet = room.copy()
    sd = ImageDraw.Draw(sheet)
    for spot, ings in SPOTS.items():
        data["spots"][spot] = {}
        for ing, spec in ings.items():
            patch, (x0, y0, x1, y1), (hx0, hy0, hx1, hy1) = render(ing, spot, spec)
            fname = f"{ing}--{spot}.webp"
            patch.save(os.path.join(OUT, "patches", fname), quality=90, method=6)
            data["spots"][spot][ing] = {
                "src": f"/game-art/potion/patches/{fname}",
                "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0,
                "hit": [hx0, hy0, hx1 - hx0, hy1 - hy0],
            }
            sd.rectangle([hx0, hy0, hx1, hy1], outline=(111, 211, 255), width=2)
            sd.text((hx0, max(0, hy0 - 12)), f"{ing[:6]}@{spot}", fill=(111, 211, 255))
    with open(JSON_OUT, "w") as f:
        json.dump(data, f, indent=1)
    sheet.convert("RGB").save(os.path.join(SRC, "_contact.png"))
    print("spots:", sum(len(v) for v in SPOTS.values()), "patches written")


if __name__ == "__main__":
    main()
