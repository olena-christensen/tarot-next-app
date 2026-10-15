import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// In-memory stand-in for the Prisma client: just the calls payment activation
// makes, with the same "where" semantics (equality, null, not, in, notIn) and
// "data" semantics (plain value or { increment }). Enough to test the logic
// without a database.
// ---------------------------------------------------------------------------
type Row = Record<string, unknown>;

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    const value = row[key] ?? null;
    if (cond !== null && typeof cond === "object" && !(cond instanceof Date)) {
      const c = cond as { not?: unknown; in?: unknown[]; notIn?: unknown[] };
      if ("not" in c) return value !== c.not;
      if (c.in) return c.in.includes(value);
      if (c.notIn) return !c.notIn.includes(value);
    }
    return value === cond;
  });
}

function apply(row: Row, data: Row): void {
  for (const [key, val] of Object.entries(data)) {
    if (val !== null && typeof val === "object" && "increment" in (val as Row)) {
      row[key] = ((row[key] as number) ?? 0) + ((val as { increment: number }).increment);
    } else {
      row[key] = val;
    }
  }
}

function table(rows: Row[]) {
  return {
    rows,
    findFirst: async ({ where }: { where?: Row }) => rows.find((r) => matches(r, where)) ?? null,
    findUnique: async ({ where }: { where: Row }) => rows.find((r) => matches(r, where)) ?? null,
    updateMany: async ({ where, data }: { where?: Row; data: Row }) => {
      const hit = rows.filter((r) => matches(r, where));
      hit.forEach((r) => apply(r, data));
      return { count: hit.length };
    },
    update: async ({ where, data }: { where: Row; data: Row }) => {
      const row = rows.find((r) => matches(r, where));
      if (!row) throw new Error("Record to update not found");
      apply(row, data);
      return row;
    },
    create: async ({ data }: { data: Row }) => {
      const row: Row = { readingCredits: 0, planId: "FREE", ...data };
      rows.push(row);
      return row;
    },
  };
}

const db = vi.hoisted(() => ({ current: null as unknown as Record<string, unknown> }));

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return db.current;
  },
}));

vi.mock("@/lib/mailer", () => ({
  sendRenewalReceiptEmail: vi.fn(async () => {}),
  sendPaymentFailedEmail: vi.fn(async () => {}),
}));

import { applyMonoInvoiceStatus } from "@/lib/paymentActivation";
import { sendPaymentFailedEmail, sendRenewalReceiptEmail } from "@/lib/mailer";

const NOW = new Date("2026-10-15T12:00:00Z");
const USER = "user-1";

let subs: ReturnType<typeof table>;
let payments: ReturnType<typeof table>;

function makeDb() {
  subs = table([]);
  payments = table([]);
  const users = table([{ id: USER, email: "anna@example.com", preferredLocale: "en" }]);
  const client = {
    subscription: subs,
    payment: payments,
    user: users,
    $executeRaw: async () => 0,
    $transaction: async (fn: (tx: unknown) => unknown) => fn(client),
  };
  db.current = client;
}

/** What create-invoice (or the renewal cron) leaves behind for one checkout. */
function checkout(invoiceId: string, product: string, reference = `${USER}:${product}:1`) {
  const sub = subs.rows.find((r) => r.userId === USER);
  const slot = {
    pendingPlanId: product,
    monoInvoiceId: invoiceId,
    paymentStatus: "created",
    activatedInvoiceId: null,
  };
  if (sub) Object.assign(sub, slot);
  else subs.rows.push({ id: "sub-1", userId: USER, planId: "FREE", expiresAt: null, readingCredits: 0, renewalAttempts: 0, ...slot });
  payments.rows.push({ userId: USER, monoInvoiceId: invoiceId, productType: product, reference, status: "created" });
}

const sub = () => subs.rows[0];
const payment = (invoiceId: string) => payments.rows.find((r) => r.monoInvoiceId === invoiceId)!;

beforeEach(() => {
  makeDb();
  vi.clearAllMocks();
});

describe("applyMonoInvoiceStatus", () => {
  it("success: a moonstone pack adds to the balance and settles the checkout", async () => {
    checkout("inv-1", "MOONSTONES_10");
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW);

    expect(sub().readingCredits).toBe(10);
    expect(sub().planId).toBe("FREE");
    expect(sub().paymentStatus).toBe("success");
    expect(sub().pendingPlanId).toBeNull();
    expect(payment("inv-1").status).toBe("success");
  });

  it("success: a first monthly purchase starts the tier from now", async () => {
    checkout("inv-1", "MONTHLY");
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success", cardToken: "tok" }, NOW);

    expect(sub().planId).toBe("MONTHLY");
    expect(sub().expiresAt).toEqual(new Date("2026-11-15T12:00:00Z"));
    expect(sub().monoCardToken).toBe("tok");
    expect(sendRenewalReceiptEmail).not.toHaveBeenCalled();
  });

  it("success: a renewal extends from the old expiry and sends a receipt", async () => {
    checkout("inv-0", "MONTHLY");
    Object.assign(sub(), { planId: "MONTHLY", expiresAt: new Date("2026-10-14T00:00:00Z") });
    checkout("inv-1", "MONTHLY", `${USER}:MONTHLY:renewal:1`);
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW);

    expect(sub().expiresAt).toEqual(new Date("2026-11-14T00:00:00Z"));
    expect(sendRenewalReceiptEmail).toHaveBeenCalledTimes(1);
  });

  it("repeat delivery: the same success twice grants once", async () => {
    checkout("inv-1", "MOONSTONES_3");
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW);
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW);

    expect(sub().readingCredits).toBe(3);
  });

  it("repeat delivery: two deliveries at the same moment grant once", async () => {
    checkout("inv-1", "MOONSTONES_3");
    await Promise.all([
      applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW),
      applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW),
    ]);

    expect(sub().readingCredits).toBe(3);
  });

  it("expired: settles the checkout, grants nothing, sends no email", async () => {
    checkout("inv-1", "MONTHLY");
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "expired" }, NOW);

    expect(sub().paymentStatus).toBe("expired");
    expect(sub().pendingPlanId).toBeNull();
    expect(sub().planId).toBe("FREE");
    expect(payment("inv-1").status).toBe("expired");
    expect(sendPaymentFailedEmail).not.toHaveBeenCalled();
  });

  it("failure: grants nothing; a failed renewal sends the payment-failed email", async () => {
    checkout("inv-0", "MONTHLY");
    Object.assign(sub(), { planId: "MONTHLY", expiresAt: new Date("2026-10-14T00:00:00Z") });
    checkout("inv-1", "MONTHLY", `${USER}:MONTHLY:renewal:1`);
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "failure", failureReason: "no funds" }, NOW);

    expect(sub().paymentStatus).toBe("failure");
    expect(sub().expiresAt).toEqual(new Date("2026-10-14T00:00:00Z"));
    expect(payment("inv-1").status).toBe("failure");
    expect(payment("inv-1").failureReason).toBe("no funds");
    expect(sendPaymentFailedEmail).toHaveBeenCalledTimes(1);
  });

  it("reversed: a late duplicate success after a reversal grants nothing more", async () => {
    checkout("inv-1", "MOONSTONES_10");
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW);
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "reversed" }, NOW);
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW);

    expect(sub().readingCredits).toBe(10);
    expect(payment("inv-1").status).toBe("reversed");
  });

  it("an intermediate status never overwrites a settled one", async () => {
    checkout("inv-1", "MOONSTONES_3");
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW);
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "processing" }, NOW);

    expect(sub().paymentStatus).toBe("success");
    expect(payment("inv-1").status).toBe("success");
  });

  // --- Review item 1: one "current invoice" slot per user ------------------

  it("two checkouts open, the first one paid: the first one is granted", async () => {
    checkout("inv-1", "MOONSTONES_25");
    checkout("inv-2", "MOONSTONES_3"); // second tab overwrote the slot
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW);

    expect(sub().readingCredits).toBe(25);
    expect(payment("inv-1").status).toBe("success");
    // The open second checkout still looks in flight.
    expect(sub().paymentStatus).toBe("created");
    expect(sub().pendingPlanId).toBe("MOONSTONES_3");
  });

  it("both checkouts paid: both are granted", async () => {
    checkout("inv-1", "MOONSTONES_25");
    checkout("inv-2", "MOONSTONES_3");
    await applyMonoInvoiceStatus({ invoiceId: "inv-2", status: "success" }, NOW);
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW);

    expect(sub().readingCredits).toBe(28);
  });

  it("a renewal that took the slot mid-checkout does not turn moonstones into a month", async () => {
    checkout("inv-0", "MONTHLY");
    Object.assign(sub(), { planId: "MONTHLY", expiresAt: new Date("2026-10-14T00:00:00Z") });
    checkout("inv-1", "MOONSTONES_10");
    checkout("inv-2", "MONTHLY", `${USER}:MONTHLY:renewal:1`);
    await applyMonoInvoiceStatus({ invoiceId: "inv-1", status: "success" }, NOW);

    expect(sub().readingCredits).toBe(10);
    expect(sub().expiresAt).toEqual(new Date("2026-10-14T00:00:00Z"));
  });

  it("an invoice with no ledger row throws so the webhook is retried", async () => {
    await expect(
      applyMonoInvoiceStatus({ invoiceId: "inv-unknown", status: "success" }, NOW)
    ).rejects.toThrow();
  });
});
