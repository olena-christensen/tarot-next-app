// Rotating, on-brand header greetings. The copy lives in the i18n layer
// (messages/{locale}/greetings.json, "greetings" namespace); this module owns
// only the key catalog and the per-session selection logic. resolveGreeting is
// the single entry point — add new pools or rules here, never in the header.

/** Greeting keys that embed a single {name} placeholder. */
export const GREETING_KEYS = [
  "returned",
  "circleComplete",
  "fold",
  "beginsAgain",
  "theyAlwaysDo",
  "feltYouComing",
  "enterFreely",
  "othersWereWrong",
  "asForetold",
  "seatKeptWarm",
  "rightOnTime",
  "signsCorrect",
  "somethingStirred",
  "nobodyLeaves",
  "findsYouAnyway",
  "ritualResumes",
  "weAlwaysKnow",
] as const;

/** Name-free keys, used when there's no display name to substitute. */
export const NAME_FREE_KEYS = [
  "anonReturned",
  "anonCircleComplete",
  "anonBeginsAgain",
  "anonFeltYouComing",
  "anonNobodyLeaves",
] as const;

export type GreetingKey =
  | (typeof GREETING_KEYS)[number]
  | (typeof NAME_FREE_KEYS)[number];

const SESSION_STORAGE_KEY = "theveil_greeting";
const PREV_STORAGE_KEY = "theveil_greeting_prev";

export type GreetingContext = {
  /** Display name; blank/whitespace/undefined → a name-free greeting. */
  name?: string | null;
  /** next-intl translate fn bound to the "greetings" namespace. */
  t: (key: string, values?: Record<string, string>) => string;
  /** Per-session store for the chosen key (default: window.sessionStorage). */
  sessionStore?: Storage | null;
  /** Cross-session store for the last key, to avoid repeats (default: localStorage). */
  persistentStore?: Storage | null;
  /** Injectable RNG for deterministic tests (default: Math.random). */
  random?: () => number;
};

const browserStore = (which: "session" | "local"): Storage | null =>
  typeof window === "undefined"
    ? null
    : which === "session"
      ? window.sessionStorage
      : window.localStorage;

/**
 * Pick a key from `pool`, avoiding `avoid` when the pool can spare it. Pure —
 * no storage side effects.
 */
export function pickKey(
  pool: readonly string[],
  avoid: string | null,
  random: () => number,
): string {
  const candidates =
    pool.length > 1 && avoid ? pool.filter((k) => k !== avoid) : [...pool];
  const index = Math.min(
    candidates.length - 1,
    Math.floor(random() * candidates.length),
  );
  return candidates[index];
}

/**
 * Resolve the header greeting for this browser session.
 *
 * The key is chosen ONCE per session and cached in sessionStorage, so
 * re-renders and client-side navigation reuse it — no flicker, no reshuffle.
 * The previous session's key is held in localStorage and avoided next time.
 * Caching the KEY (not the rendered text) means a mid-session locale switch
 * re-renders the same greeting in the new language.
 */
export function resolveGreeting(ctx: GreetingContext): string {
  const {
    name,
    t,
    random = Math.random,
    sessionStore = browserStore("session"),
    persistentStore = browserStore("local"),
  } = ctx;

  const trimmed = typeof name === "string" ? name.trim() : "";
  const hasName = trimmed.length > 0;
  const pool: readonly string[] = hasName ? GREETING_KEYS : NAME_FREE_KEYS;

  let key = sessionStore?.getItem(SESSION_STORAGE_KEY) ?? null;
  if (!key || !pool.includes(key)) {
    const prev = persistentStore?.getItem(PREV_STORAGE_KEY) ?? null;
    key = pickKey(pool, prev, random);
    sessionStore?.setItem(SESSION_STORAGE_KEY, key);
    persistentStore?.setItem(PREV_STORAGE_KEY, key);
  }

  return hasName ? t(key, { name: trimmed }) : t(key);
}
