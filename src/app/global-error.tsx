"use client";

import { useEffect } from "react";

/**
 * Last resort: catches errors thrown by a ROOT layout, where every segment
 * boundary above has already failed.
 *
 * Three constraints make this file deliberately unlike the rest of the app:
 *
 * 1. **It replaces the root layout**, so it must render its own `<html>` and
 *    `<body>` — nothing else will.
 * 2. **Styles are inline.** The stylesheet is imported by the layout that just
 *    failed; relying on a class here would risk unstyled text on white.
 * 3. **Copy is English only.** Reaching this file means the locale layout and
 *    its `NextIntlClientProvider` did not mount, so `useTranslations` would
 *    throw and take the fallback down with it. This is the ONE place in the app
 *    exempt from the translation rule, and that exemption is the point — do not
 *    "fix" it by adding a hook here.
 *
 * The palette is repeated from `_variables.scss` for the same reason the OG
 * image repeats it: no CSS custom properties are guaranteed to exist here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? "", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "2rem 1.5rem",
          textAlign: "center",
          backgroundColor: "#090909",
          color: "#fae1a3",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 300,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.7rem",
            letterSpacing: "0.38em",
            textTransform: "uppercase",
          }}
        >
          The Veil
        </p>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 300 }}>
          The Veil Has Torn
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: "28rem",
            lineHeight: 1.7,
            color: "rgba(250, 225, 163, 0.7)",
          }}
        >
          Something went wrong that we did not foresee. Try again — and if the
          dark persists, it is on our side, not yours.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.75rem 1.75rem",
            fontFamily: "inherit",
            fontSize: "0.8rem",
            fontWeight: 300,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#fae1a3",
            backgroundColor: "transparent",
            border: "1px solid rgba(250, 225, 163, 0.35)",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
