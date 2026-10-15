import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { join } from "node:path";
import { getTranslations } from "next-intl/server";
import { tarots } from "@/data";
import { getCardImagePath, DEFAULT_DECK } from "@/lib/decks";
import { getCardMeaning } from "@/lib/cardMeanings";
import { parseSymbolCode } from "@/lib/dreamMeanings";
import { localizeDream } from "@/lib/dreamTranslations";
import { symbolsPhrase } from "@/lib/dreamResult";

export const alt = "A dream from The Veil";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

const CARD_IMAGES: Record<string, string> = Object.fromEntries(
  tarots.map((card) => [card.id, card.image])
);

// Palette mirrors _variables.scss; satori can't read CSS variables.
const GOLD = "#fae1a3";
const GOLD_SOFT = "rgba(250, 225, 163, 0.75)";
const DARK = "#090909";

const CARD_WIDTH = 300;
const CARD_HEIGHT = 506;

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://theveil.app").replace(/\/$/, "");
}

/** Card art as PNG data (satori can't decode the WebP art), same approach as the reading picture. */
async function cardDataUri(cardId: string): Promise<string | null> {
  const relative = CARD_IMAGES[cardId];
  if (!relative) return null;
  try {
    const res = await fetch(`${appOrigin()}${getCardImagePath(DEFAULT_DECK, relative)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const png = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(CARD_WIDTH * 2, CARD_HEIGHT * 2, { fit: "fill" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (err) {
    console.error("[og] dream card render failed", cardId, err);
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

export default async function Image({
  params,
}: {
  params: { locale: string; symbols: string; card: string };
}) {
  const dreams = parseSymbolCode(params.symbols)?.map((d) => localizeDream(d, params.locale));
  const card = getCardMeaning(params.card);
  const t = await getTranslations({ locale: params.locale, namespace: "dreams" });
  const tCards = await getTranslations({ locale: params.locale, namespace: "cards" });
  const font = await loadFont();

  const cardName = card ? (params.locale === "en" ? card.title : tCards(card.id)) : "";
  const phrase = dreams ? symbolsPhrase(dreams, params.locale) : "";
  const art = card ? await cardDataUri(card.id) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: DARK,
          backgroundImage:
            "radial-gradient(circle at 24% 50%, rgba(90,62,40,0.7), transparent 60%), radial-gradient(circle at 85% 20%, rgba(68,53,35,0.5), transparent 55%)",
          fontFamily: "Raleway",
          padding: "0 90px 0 96px",
        }}
      >
        {art && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={art}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            style={{ borderRadius: 14, border: "1px solid rgba(250,225,163,0.65)" }}
            alt=""
          />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            marginLeft: art ? 84 : 0,
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, textTransform: "uppercase", color: GOLD_SOFT }}>
            {t("ogKicker")}
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 72, lineHeight: 1.08, color: GOLD }}>
            {t("ogDreamed", { symbols: phrase })}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 28, lineHeight: 1.5, color: GOLD_SOFT }}>
            {t("ogCard", { card: cardName })}
          </div>
          <div style={{ display: "flex", marginTop: 44, fontSize: 24, letterSpacing: 3, color: GOLD }}>
            theveil.app/dreams
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(font
        ? { fonts: [{ name: "Raleway", data: font, style: "normal" as const, weight: 300 as const }] }
        : {}),
    }
  );
}
