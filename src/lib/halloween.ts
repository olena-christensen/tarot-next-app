/**
 * Halloween countdown banner at the top of every page — when it shows.
 *
 * October only, by the visitor's own clock: a countdown to midnight on
 * 31 October, then "Halloween is here" for the whole of 31 October, then
 * nothing from 1 November. Same October rule as the pumpkin pill's
 * "Halloween is coming" (GameEntrance).
 *
 * The decision runs before the first paint, like the intro (src/lib/intro.ts):
 * `halloweenBootScript()` is inlined at the top of <body> and sets
 * `<html data-halloween="countdown" | "night">`. The banner is always in the
 * server HTML and CSS shows it only under that attribute, so the page never
 * jumps when it appears and server and client HTML stay identical.
 */

export const HALLOWEEN_ATTR = "data-halloween";

export type HalloweenPhase = "countdown" | "night" | null;

/**
 * Pure, and self-contained on purpose: its source is inlined into the boot
 * script via toString(), so it must not reference anything outside itself.
 */
export function halloweenPhase(now: Date): HalloweenPhase {
  if (now.getMonth() !== 9) return null;
  return now.getDate() === 31 ? "night" : "countdown";
}

/** Time left until midnight at the start of 31 October this year, never below zero. */
export function msUntilHalloween(now: Date): number {
  const target = new Date(now.getFullYear(), 9, 31);
  return Math.max(0, target.getTime() - now.getTime());
}

/** Splits a duration into the four numbers the banner shows. */
export function splitCountdown(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
  };
}

/** Sets or clears the attribute for the given moment; the banner keeps it current while open. */
export function applyHalloweenPhase(now: Date): HalloweenPhase {
  const phase = halloweenPhase(now);
  if (phase) document.documentElement.setAttribute(HALLOWEEN_ATTR, phase);
  else document.documentElement.removeAttribute(HALLOWEEN_ATTR);
  return phase;
}

/** Inline script for the top of <body>. Any failure means no banner. */
export function halloweenBootScript(): string {
  return `(function(){try{
var p=(${halloweenPhase.toString()})(new Date());
if(p){document.documentElement.setAttribute(${JSON.stringify(HALLOWEEN_ATTR)},p);}
}catch(e){}})();`;
}
