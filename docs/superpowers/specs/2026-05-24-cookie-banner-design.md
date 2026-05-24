# Cookie Banner — Design

**Date:** 2026-05-24
**Branch:** `cookie-banner`
**Status:** Approved, ready for implementation planning

## Goal

Add a GDPR-aware cookie consent banner to The Veil. The Privacy Policy already references "our cookie banner" but no banner exists yet; this closes that gap and lays the groundwork for any future analytics/tracking scripts to be gated on user consent.

## Non-goals

- No analytics integration in this change. No Vercel Analytics, Google Analytics, Plausible, etc. are wired up.
- No granular consent categories (essential / analytics / marketing toggles).
- No server-side consent audit log.
- No periodic re-prompt / consent expiry.
- No geo-detection (banner shows for all visitors regardless of region).

## User-facing behavior

### First visit
1. Page loads normally.
2. A bottom full-width bar fades/slides in shortly after mount.
3. Bar contains: a short message with an inline "Learn more" link to `/privacy`, and two buttons on the right: **Reject** (secondary) and **Accept** (primary).
4. Clicking either button fades the bar out and stores the choice. Bar will not re-appear on subsequent visits.

### Subsequent visits
- Banner stays hidden as long as a stored consent value is present.

### Withdrawing / changing consent
- Footer gains a third link: **Cookie settings**, next to Terms and Privacy.
- Clicking it clears the stored consent value and re-shows the banner so the user can pick again.

## Architecture

### New files
- `src/components/CookieBanner.tsx` — client component, the bar itself.
- `src/assets/scss/blocks/_cookie-banner.scss` — block styles.

### Modified files
- `src/components/Footer.tsx` — add "Cookie settings" link that dispatches a reset event.
- `src/app/[locale]/layout.tsx` — mount `<CookieBanner />` once, near `<Footer />`.
- `src/assets/scss/main.scss` (or whichever is the entry) — import the new block.
- `messages/{en,no,uk,tr,ru}/ui.json` — five new keys (see below).

### State storage
- **Mechanism:** `localStorage`
- **Key:** `theveil_cookie_consent`
- **Values:** `"accepted"` | `"rejected"`
- **Rationale:** No server-side read is needed today. Avoids extra cookies on every request and removes SSR hydration complexity. Future client-side analytics scripts can read this synchronously before initializing.

### Coordination between Footer and Banner
- A `window` custom event: `theveil:cookie-consent-reset`.
- `Footer.tsx`'s "Cookie settings" click handler: removes the `localStorage` key, then dispatches the event.
- `CookieBanner.tsx` adds a `window.addEventListener` for that event in `useEffect`, sets its internal "visible" state back to `true`.
- **Rationale:** A context provider would be cleaner if more components needed this state, but only two siblings care. A custom event is the lightest viable coupling.

### Hydration safety
- `CookieBanner` returns `null` on the first render.
- A `useEffect` reads `localStorage` and sets `visible = !storedValue`.
- This avoids any SSR/CSR mismatch and prevents a flash of the banner for users who already consented.

### Animations
- Mount: fade + small upward slide-in. Use existing easing language (`var(--font-family)` etc. are CSS-side; the easing/durations should match the header's slide-down feel — short, calm).
- Dismiss: fade out before unmount.
- Reduced motion: respect `prefers-reduced-motion: reduce` and skip the slide, keep the fade short.

## Visual / styling

- **Position:** `position: fixed; left: 0; right: 0; bottom: 0;` full-width.
- **Background:** `var(--bg)` with a subtle top border (`var(--border-color)`) to separate from page content. Slight backdrop blur acceptable if it fits The Veil's existing surfaces.
- **Layout:** flex row, message on the left, button group on the right. Stacks vertically on narrow screens.
- **Text:** uses `var(--text-soft)` for the body, `var(--gold)` for the inline link.
- **Buttons:** existing `<MysticButton>` component. Primary look for **Accept**, secondary look for **Reject** (use whatever variant prop the component already supports; if it doesn't, this spec does NOT introduce a new variant — the buttons can both be primary and we accept that mild visual symmetry).
- **No new colors.** Everything uses the existing palette.

## i18n

Add to all five `messages/{locale}/ui.json` files under the existing `ui` namespace:

| Key | English source string |
|---|---|
| `cookieBannerMessage` | "We use cookies to keep you signed in and, with your consent, to understand how The Veil is used." |
| `cookieBannerLearnMore` | "Learn more" |
| `cookieBannerAccept` | "Accept" |
| `cookieBannerReject` | "Reject" |
| `cookieSettings` | "Cookie settings" |

- English is the source of truth.
- Norwegian, Russian, Ukrainian, and Turkish get high-quality machine translations as a starting point — these are flagged for polish by Olena.
- Russian UI must use formal "вы" (per existing convention in `feedback_russian_formal`).
- The message string deliberately mentions both essential ("keep you signed in") and optional ("understand how The Veil is used") cookies so it stays accurate once analytics are added.

## Implementation order (will be expanded in the plan)

1. Add SCSS block and i18n keys.
2. Build `CookieBanner.tsx` with localStorage gate, mount in layout.
3. Add "Cookie settings" link to footer + custom-event wiring.
4. Manual QA across locales and a refresh cycle.

## Open questions

None blocking. If The Veil later adds Vercel Analytics or another tracker, a follow-up spec will define how consent is read at script-load time.
