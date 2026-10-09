import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { getTranslations } from "next-intl/server";
import { giftView, type GiftView } from "@/lib/castleGame/server";
import { catalogItem } from "@/lib/castleGame/catalog";

/**
 * The picture a gift link shows when shared (Lena approved the mockup,
 * 2026-10-09): the item that was sent, glowing in the dim castle hall, with the
 * sender's first name and the item's name. Built like the reading previews in
 * /r/[shareId]: art fetched over HTTP (public/ is not in the function's files)
 * and turned from WebP into PNG/JPEG, because the image renderer cannot read WebP.
 */

export const alt = "A gift for your castle — They Arrive at Midnight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

const GOLD = "#fae1a3";
const DARK = "#090909";
const VALID_ID = /^[a-z0-9]{10,40}$/;

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://theveil.app").replace(/\/$/, "");
}

async function art(path: string, convert: (img: sharp.Sharp) => sharp.Sharp, mime: string): Promise<string | null> {
  try {
    const res = await fetch(`${appOrigin()}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const out = await convert(sharp(Buffer.from(await res.arrayBuffer()))).toBuffer();
    return `data:${mime};base64,${out.toString("base64")}`;
  } catch (err) {
    // A missing picture must not take the whole preview down.
    console.error("[og] castle art failed", path, err);
    return null;
  }
}

async function loadFont(): Promise<Buffer | null> {
  try {
    return await readFile(join(process.cwd(), "assets/fonts/Raleway-Light.ttf"));
  } catch (err) {
    console.error("[og] font unavailable, falling back to default", err);
    return null;
  }
}

async function view(id: string): Promise<GiftView> {
  if (!VALID_ID.test(id)) return { status: "gone", itemId: null, from: null };
  try {
    return await giftView(id);
  } catch {
    return { status: "gone", itemId: null, from: null };
  }
}

export default async function Image({ params }: { params: { locale: string; id: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "castle" });
  const gift = await view(params.id);
  const itemId = gift.itemId && catalogItem(gift.itemId) ? gift.itemId : null;

  const [font, room, icon] = await Promise.all([
    loadFont(),
    art("/game-art/castle/room.webp", (img) => img.resize(1200, 630, { fit: "cover" }).jpeg({ quality: 80 }), "image/jpeg"),
    itemId
      ? art(
          `/game-art/castle/icons/${itemId}.webp`,
          (img) => img.resize(720, 720, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png(),
          "image/png",
        )
      : Promise.resolve(null),
  ]);

  const itemName = itemId ? t(`items.${itemId}`) : null;
  const from = gift.from ? t("giftSentYou", { name: gift.from }) : t("giftSentYouAnon");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: DARK, fontFamily: "Raleway" }}>
        {room && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={room} width={1200} height={630} style={{ position: "absolute", top: 0, left: 0 }} alt="" />
        )}
        {/* the hall dims towards the words */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            backgroundImage:
              "linear-gradient(90deg, rgba(9,9,9,0.55) 0%, rgba(9,9,9,0.55) 30%, rgba(9,9,9,0.9) 65%, rgba(9,9,9,0.9) 100%)",
          }}
        />
        {/* warm glow behind the item */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 45,
            width: 520,
            height: 520,
            display: "flex",
            backgroundImage: "radial-gradient(circle at center, rgba(250,225,163,0.32) 0%, rgba(250,225,163,0.12) 38%, rgba(250,225,163,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 20,
            width: 1160,
            height: 590,
            display: "flex",
            border: "1px solid rgba(250,225,163,0.35)",
          }}
        />
        <div style={{ position: "absolute", left: 120, top: 135, width: 360, height: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} width={360} height={360} alt="" />
          )}
        </div>
        <div style={{ position: "absolute", left: 580, top: 160, width: 560, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, color: "rgba(250,225,163,0.75)" }}>{from}</div>
          {itemName && (
            <div style={{ marginTop: 18, fontSize: itemName.length > 22 ? 52 : 64, lineHeight: 1.1, color: GOLD }}>{itemName}</div>
          )}
          <div style={{ marginTop: 26, width: 118, height: 1, display: "flex", background: "rgba(250,225,163,0.55)" }} />
          {gift.status === "available" && (
            <div style={{ marginTop: 22, fontSize: 28, color: "rgba(250,225,163,0.6)" }}>{t("takeGift")}</div>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            left: 580,
            top: 528,
            display: "flex",
            fontSize: 22,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "rgba(250,225,163,0.55)",
          }}
        >
          {`${t("title")}  ·  The Veil`}
        </div>
      </div>
    ),
    {
      ...size,
      ...(font ? { fonts: [{ name: "Raleway", data: font, style: "normal" as const, weight: 300 as const }] } : {}),
    },
  );
}
