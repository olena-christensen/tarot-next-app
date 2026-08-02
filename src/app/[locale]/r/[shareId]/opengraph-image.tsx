import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { join } from "node:path";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { tarots } from "@/data";
import { getCardImagePath, DEFAULT_DECK } from "@/lib/decks";
import { READER_IDS, type ReaderId } from "@/lib/readers";

export const alt = "A reading from The Veil";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Prisma and node:fs both need the Node runtime — ImageResponse supports it.
export const runtime = "nodejs";

const CARD_IMAGES: Record<string, string> = Object.fromEntries(
  tarots.map((card) => [card.id, card.image])
);

// Palette mirrors _variables.scss. Satori can't resolve CSS custom properties,
// so the raw values are repeated here — keep them in step with the stylesheet.
const GOLD = "#fae1a3";
const GOLD_SOFT = "rgba(250, 225, 163, 0.75)";
const GOLD_FAINT = "rgba(250, 225, 163, 0.55)";
const DARK = "#090909";

// Drawn size of each card; the source is transcoded at 2x for crisp edges.
const CARD_WIDTH = 190;
const CARD_HEIGHT = 332;

/**
 * Card art as a data URI — read from disk so this works without a public URL.
 *
 * The deck art is WebP, which the image renderer (satori) CANNOT decode: handing
 * it one throws "a is not iterable" and kills the whole response. So each card is
 * transcoded to PNG with sharp (already a direct dependency) and resized to the
 * size it's drawn at, which keeps the payload small too.
 */
async function cardDataUri(deck: string, cardId: string): Promise<string | null> {
  const relative = CARD_IMAGES[cardId];
  if (!relative) return null;
  try {
    const file = join(process.cwd(), "public", getCardImagePath(deck, relative));
    const png = await sharp(await readFile(file))
      .resize(CARD_WIDTH * 2, CARD_HEIGHT * 2, { fit: "fill" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (err) {
    // A missing or unreadable card must not take the whole image down.
    console.error("[og] card render failed", cardId, err);
    return null;
  }
}

export default async function Image({
  // Next.js 14: params is a plain object, not a promise.
  params,
}: {
  params: { locale: string; shareId: string };
}) {
  const reading = await prisma.reading.findUnique({
    where: { shareId: params.shareId },
    select: { cards: true, title: true, readerId: true, deckId: true },
  });

  const t = await getTranslations({
    locale: params.locale,
    namespace: "history",
  });
  const tReaders = await getTranslations({
    locale: params.locale,
    namespace: "readers",
  });

  const font = await readFile(
    join(process.cwd(), "assets/fonts/Raleway-Light.ttf")
  );

  const deck = reading?.deckId ?? DEFAULT_DECK;
  const cards = (reading?.cards ?? []).slice(0, 3);
  const images = await Promise.all(cards.map((id) => cardDataUri(deck, id)));
  const readerName =
    reading?.readerId && READER_IDS.includes(reading.readerId as ReaderId)
      ? tReaders(`${reading.readerId}.displayName`)
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: DARK,
          // Two soft pools of light instead of a flat field — the app's mood.
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(250,225,163,0.16), transparent 55%), radial-gradient(circle at 50% 100%, rgba(68,53,35,0.5), transparent 60%)",
          fontFamily: "Raleway",
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 46,
            letterSpacing: 2,
            color: GOLD,
            textAlign: "center",
            marginBottom: readerName ? 8 : 28,
          }}
        >
          {reading?.title || t("sharedTitle")}
        </div>
        {readerName && (
          <div
            style={{
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: GOLD_FAINT,
              marginBottom: 28,
            }}
          >
            {readerName}
          </div>
        )}
        <div style={{ display: "flex", gap: 28 }}>
          {images.map((src, index) =>
            src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                src={src}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                style={{ borderRadius: 8 }}
                alt=""
              />
            ) : null
          )}
        </div>
        <div
          style={{
            marginTop: 34,
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: GOLD_SOFT,
          }}
        >
          theveil.app
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Raleway", data: font, style: "normal", weight: 300 }],
    }
  );
}
