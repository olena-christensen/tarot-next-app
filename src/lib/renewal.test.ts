import { describe, it, expect } from "vitest";
import { decideRenewalAction, GRACE_MAX_RETRIES, type RenewalInput } from "./renewal";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-01T06:00:00.000Z");

// A baseline active subscriber whose charge is due now. Each test overrides fields.
function sub(overrides: Partial<RenewalInput> = {}): RenewalInput {
  return {
    autoRenew: true,
    planId: "MONTHLY",
    expiresAt: NOW,
    nextChargeAt: NOW,
    monoCardToken: "tok_abc",
    paymentStatus: "success",
    renewalAttempts: 0,
    lastRenewalAttemptAt: null,
    ...overrides,
  };
}

describe("decideRenewalAction", () => {
  it("charges when due, token present, autoRenew on, no attempts yet", () => {
    expect(decideRenewalAction(sub(), NOW)).toEqual({ type: "charge" });
  });

  it("does nothing when not yet due", () => {
    const future = new Date(NOW.getTime() + 5 * DAY);
    expect(decideRenewalAction(sub({ nextChargeAt: future }), NOW)).toEqual({ type: "none" });
  });

  it("downgrades a canceled sub once the period is over", () => {
    expect(
      decideRenewalAction(sub({ autoRenew: false, expiresAt: NOW }), NOW)
    ).toEqual({ type: "downgrade", reason: "canceled" });
  });

  it("does nothing for a canceled sub still within its paid period", () => {
    const future = new Date(NOW.getTime() + 5 * DAY);
    expect(
      decideRenewalAction(sub({ autoRenew: false, expiresAt: future }), NOW)
    ).toEqual({ type: "none" });
  });

  it("downgrades when there is no token and the period is over", () => {
    expect(
      decideRenewalAction(sub({ monoCardToken: null, expiresAt: NOW }), NOW)
    ).toEqual({ type: "downgrade", reason: "no_token" });
  });

  it("does nothing when there is no token but still within the period", () => {
    const future = new Date(NOW.getTime() + 5 * DAY);
    expect(
      decideRenewalAction(sub({ monoCardToken: null, expiresAt: future }), NOW)
    ).toEqual({ type: "none" });
  });

  it("downgrades when retries are exhausted and the last attempt failed", () => {
    expect(
      decideRenewalAction(
        sub({ renewalAttempts: GRACE_MAX_RETRIES, paymentStatus: "failure" }),
        NOW
      )
    ).toEqual({ type: "downgrade", reason: "payment_failed" });
  });

  it("does NOT downgrade at the retry cap if the last status is not a failure", () => {
    // e.g. an in-flight retry that hasn't resolved — must not give up yet.
    expect(
      decideRenewalAction(
        sub({ renewalAttempts: GRACE_MAX_RETRIES, paymentStatus: "processing" }),
        NOW
      )
    ).toEqual({ type: "none" });
  });

  it("skips when a charge is already in flight (created/processing)", () => {
    expect(decideRenewalAction(sub({ paymentStatus: "created" }), NOW)).toEqual({ type: "none" });
    expect(decideRenewalAction(sub({ paymentStatus: "processing" }), NOW)).toEqual({ type: "none" });
  });

  it("retries the day after a failure", () => {
    const yesterday = new Date(NOW.getTime() - DAY);
    expect(
      decideRenewalAction(
        sub({ renewalAttempts: 1, paymentStatus: "failure", lastRenewalAttemptAt: yesterday }),
        NOW
      )
    ).toEqual({ type: "charge" });
  });

  it("does NOT retry twice within the same day", () => {
    const hourAgo = new Date(NOW.getTime() - 60 * 60 * 1000);
    expect(
      decideRenewalAction(
        sub({ renewalAttempts: 1, paymentStatus: "failure", lastRenewalAttemptAt: hourAgo }),
        NOW
      )
    ).toEqual({ type: "none" });
  });
});
