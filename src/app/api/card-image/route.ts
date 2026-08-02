import sharp from "sharp";
import { tarots } from "@/data";
import { DECK_IDS, DEFAULT_DECK, getCardImagePath } from "@/lib/decks";

// sharp needs the Node runtime.
export const runtime = "nodejs";

const CARD_IMAGES: Record<string, string> = Object.fromEntries(
  tarots.map((card) => [card.id, card.image])
);

// Drawn at 260px in the email; served at 2× for retina.
const WIDTH = 520;

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://theveil.app").replace(
    /\/$/,
    ""
  );
}

/**
 * Card art as PNG, for email.
 *
 * The deck is WebP, which Outlook desktop cannot render — an email `<img>` has to
 * point at a URL, so this route is the transcode. Everything on-site keeps using
 * the WebP directly; this exists only for mail clients.
 *
 * Source art is FETCHED over HTTP rather than read off disk: `public/` is
 * CDN-served and is not on the serverless function's filesystem (the same trap
 * the OG image hit in production while dev was happy).
 *
 * Both parameters are matched against the catalogues — never interpolated into a
 * path from raw input, which would be a traversal and SSRF hole.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get("card") ?? "";
  const deckParam = searchParams.get("deck") ?? DEFAULT_DECK;

  const relative = CARD_IMAGES[cardId];
  if (!relative) {
    return new Response("Unknown card", { status: 404 });
  }
  const deck = (DECK_IDS as readonly string[]).includes(deckParam)
    ? deckParam
    : DEFAULT_DECK;

  try {
    const res = await fetch(`${appOrigin()}${getCardImagePath(deck, relative)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const png = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(WIDTH, null, { withoutEnlargement: true })
      .png()
      .toBuffer();

    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        // Card art for a given deck never changes.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[card-image] transcode failed", { cardId, deck, err });
    return new Response("Card art unavailable", { status: 502 });
  }
}
