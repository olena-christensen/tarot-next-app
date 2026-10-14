/**
 * Home page intro — when it plays and how it ends (Lena, 2026-10-14).
 *
 * The intro plays on a FULL load of the home page, and only when it is the
 * visitor's first home-page load of the day, or when they pressed reload.
 * Never on client-side navigation, back/forward, or a full load of any other
 * page (legal pages, sign-in and payment returns land on the day's stamp).
 *
 * The decision runs before the first paint: `introBootScript()` is inlined at
 * the top of <body> in `src/app/[locale]/layout.tsx` and sets
 * `<html data-intro="play">`. Every intro animation is plain CSS keyed off that
 * attribute, so server and client HTML are identical (no hydration mismatch).
 * `armIntro()` (called by OfferBlock) ends it: a tap or key skips to the final
 * frame, and after INTRO_TOTAL_MS the attribute is dropped so a client-side
 * return to the page is instant. The final frame of every intro animation is
 * the element's normal style, so dropping the attribute never jumps.
 */

export const INTRO_DAY_KEY = "theveil_intro_day";
export const INTRO_ATTR = "data-intro";
/** CookieBanner waits for this before it shows over the intro. */
export const INTRO_DONE_EVENT = "theveil:intro-done";
/** The reader and buttons start fading in here — the banner may show from now. */
const INTRO_CONTENT_MS = 600;
/** Longer than the longest intro animation (footer: 0.9 s delay + 0.8 s). */
const INTRO_TOTAL_MS = 2000;

export type IntroInput = {
  path: string;
  /** PerformanceNavigationTiming.type: "navigate" | "reload" | "back_forward" | "prerender" */
  navType: string | undefined;
  lastDay: string | null;
  today: string;
  locales: readonly string[];
};

/**
 * Pure, and self-contained on purpose: its source is inlined into the boot
 * script via toString(), so it must not reference anything outside itself.
 */
export function shouldPlayIntro(input: IntroInput): boolean {
  const parts = input.path.split("/").filter(Boolean);
  const isHome = parts.length === 0 || (parts.length === 1 && input.locales.indexOf(parts[0]) !== -1);
  if (!isHome) return false;
  if (input.navType === "back_forward") return false;
  if (input.navType === "reload") return true;
  return input.lastDay !== input.today;
}

/** Inline script for the top of <body>. Any failure (e.g. storage blocked) means no intro. */
export function introBootScript(locales: readonly string[]): string {
  return `(function(){try{
var d=new Date(),t=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
var n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];
var s=localStorage.getItem(${JSON.stringify(INTRO_DAY_KEY)});
var play=(${shouldPlayIntro.toString()})({path:location.pathname,navType:n&&n.type,lastDay:s,today:t,locales:${JSON.stringify(locales)}});
if(play){document.documentElement.setAttribute(${JSON.stringify(INTRO_ATTR)},"play");localStorage.setItem(${JSON.stringify(INTRO_DAY_KEY)},t);}
}catch(e){}})();`;
}

export function isIntroPlaying(): boolean {
  return typeof document !== "undefined" && document.documentElement.getAttribute(INTRO_ATTR) === "play";
}

let announced = false;
function announceIntroDone() {
  if (announced) return;
  announced = true;
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
}

let armed = false;
const skipKeys: (keyof WindowEventMap)[] = ["pointerdown", "keydown"];

function endIntro() {
  skipKeys.forEach((k) => window.removeEventListener(k, endIntro, true));
  document.documentElement.removeAttribute(INTRO_ATTR);
  announceIntroDone();
}

/**
 * Module-level, not tied to a component's lifecycle: React's dev double-mount
 * must not end the intro, and leaving the page mid-intro must still drop the
 * attribute (the timer keeps running) so a return doesn't replay it.
 */
export function armIntro() {
  if (armed || !isIntroPlaying()) return;
  armed = true;
  window.setTimeout(announceIntroDone, INTRO_CONTENT_MS);
  window.setTimeout(endIntro, INTRO_TOTAL_MS);
  skipKeys.forEach((k) => window.addEventListener(k, endIntro, true));
}
