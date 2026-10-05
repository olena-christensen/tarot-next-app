import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTranslations } from "next-intl/server";
import { decodeGift } from "@/lib/potionGame";

export const alt = "A potion brewed for you at The Veil";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

// Palette mirrors _variables.scss (Satori can't read CSS custom properties).
const GOLD = "#fae1a3";
const GOLD_SOFT = "rgba(250, 225, 163, 0.8)";

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://theveil.app").replace(/\/$/, "");
}

/** Fetched over HTTP like the reading previews: public/ is served by the CDN, not bundled. */
async function bottleDataUri(): Promise<string | null> {
  try {
    const res = await fetch(`${appOrigin()}/game-art/potion/bottle.png`);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("[og] potion bottle unavailable", err);
    return null;
  }
}

async function loadFont(): Promise<Buffer | null> {
  try {
    return await readFile(join(process.cwd(), "assets/fonts/Raleway-Light.ttf"));
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: { locale: string; code: string } }) {
  const gift = decodeGift(params.code);
  const t = await getTranslations({ locale: params.locale, namespace: "game" });
  const [bottle, font] = await Promise.all([bottleDataUri(), loadFont()]);
  const potion = gift ? t(`potionNames.${gift.potion}`) : t("title");
  const from = gift?.from ? t("giftCardFrom", { name: gift.from }) : t("giftCardAnon");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 70,
          background: "#0b0810",
          backgroundImage:
            "radial-gradient(circle at 32% 50%, rgba(140,255,90,0.28), transparent 45%), radial-gradient(circle at 50% 100%, rgba(68,53,35,0.5), transparent 60%)",
          fontFamily: "Raleway",
          padding: 60,
        }}
      >
        {bottle && (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={bottle} width={330} height={440} style={{ objectFit: "contain" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
          <div style={{ fontSize: 40, color: GOLD_SOFT }}>{from}</div>
          <div style={{ fontSize: 68, color: GOLD, lineHeight: 1.1, marginTop: 14 }}>{potion}</div>
          {/* The whole card is the link in Messenger/Facebook, so this
              "button" really does open the page. */}
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 44,
              padding: "18px 44px",
              border: `2px solid ${GOLD}`,
              borderRadius: 14,
              background: "rgba(250,225,163,0.12)",
              color: GOLD,
              fontSize: 34,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {t("gifButton")}
          </div>
          <div style={{ fontSize: 24, color: GOLD_SOFT, marginTop: 22 }}>The Veil · theveil.app</div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(font ? { fonts: [{ name: "Raleway", data: font, style: "normal" as const, weight: 300 as const }] } : {}),
    },
  );
}
