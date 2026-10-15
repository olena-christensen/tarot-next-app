import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient, fakeTable, type FakeTable } from "@/lib/testing/fakePrisma";

const db = vi.hoisted(() => ({ current: null as unknown as Record<string, unknown> }));
vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return db.current;
  },
}));

import { reserveRenewalAttempt } from "@/lib/renewalReserve";

const NOW = new Date("2026-10-15T03:00:00Z");
const YESTERDAY = new Date("2026-10-14T03:00:00Z");

let subs: FakeTable;

beforeEach(() => {
  subs = fakeTable([
    {
      id: "sub-1",
      planId: "MONTHLY",
      paymentStatus: "failure",
      pendingPlanId: null,
      activatedInvoiceId: "inv-0",
      renewalAttempts: 1,
      lastRenewalAttemptAt: YESTERDAY,
    },
  ]);
  db.current = fakeClient({ subscription: subs });
});

/** What a run read at its start. */
const snapshot = () => ({ ...subs.rows[0] }) as {
  id: string;
  renewalAttempts: number;
  lastRenewalAttemptAt: Date | null;
};

describe("reserveRenewalAttempt", () => {
  it("reserves: marks the charge in flight and counts the attempt", async () => {
    expect(await reserveRenewalAttempt(snapshot(), "MONTHLY", NOW)).toBe(true);

    const row = subs.rows[0];
    expect(row.paymentStatus).toBe("created");
    expect(row.pendingPlanId).toBe("MONTHLY");
    expect(row.activatedInvoiceId).toBeNull();
    expect(row.renewalAttempts).toBe(2);
    expect(row.lastRenewalAttemptAt).toEqual(NOW);
  });

  it("two runs that read the same row: only the first may charge", async () => {
    const runA = snapshot();
    const runB = snapshot();

    expect(await reserveRenewalAttempt(runA, "MONTHLY", NOW)).toBe(true);
    expect(await reserveRenewalAttempt(runB, "MONTHLY", NOW)).toBe(false);
    expect(subs.rows[0].renewalAttempts).toBe(2);
  });

  it("a first attempt (never tried before) can be reserved once", async () => {
    Object.assign(subs.rows[0], { renewalAttempts: 0, lastRenewalAttemptAt: null, paymentStatus: "success" });
    const runA = snapshot();
    const runB = snapshot();

    expect(await reserveRenewalAttempt(runA, "MONTHLY", NOW)).toBe(true);
    expect(await reserveRenewalAttempt(runB, "MONTHLY", NOW)).toBe(false);
  });

  it("a read taken before a renewal settled does not charge again", async () => {
    const stale = snapshot();
    await reserveRenewalAttempt(snapshot(), "MONTHLY", NOW);
    // The webhook settles the renewal and resets the counter.
    Object.assign(subs.rows[0], { paymentStatus: "success", renewalAttempts: 0 });

    expect(await reserveRenewalAttempt(stale, "MONTHLY", NOW)).toBe(false);
  });
});
