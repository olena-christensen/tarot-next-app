import { createHash } from "crypto";
import { tarots } from "@/data";

/**
 * The UTC calendar day a send belongs to, as YYYY-MM-DD.
 *
 * Deliberately UTC and not the recipient's zone: the job fires once globally, so
 * "which day is it" has to have one answer or a rerun near midnight would draw a
 * second card for the same send.
 */
export function utcDayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * The card a given user gets on a given day.
 *
 * Deterministic from (userId, day) rather than random: the cron can fire twice —
 * a retry, or Vercel's scheduling imprecision straddling midnight — and must not
 * mail the same person two different cards. Nothing is persisted, so there is no
 * row to check and no write to race.
 *
 * Distribution doesn't need to be cryptographic, only stable and evenly spread;
 * SHA-256 over "userId:day" gives both. The modulo bias across 78 values out of
 * 2^32 is far below anything a person could perceive.
 */
export function pickDailyCard(userId: string, day: string) {
  const digest = createHash("sha256").update(`${userId}:${day}`).digest();
  const index = digest.readUInt32BE(0) % tarots.length;
  return tarots[index];
}
