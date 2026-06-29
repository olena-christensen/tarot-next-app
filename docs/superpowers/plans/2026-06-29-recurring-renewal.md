# Recurring Renewal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically renew MONTHLY/YEARLY subscriptions by charging the saved Mono card token, with dunning (grace + retries), cancellation, and transactional emails.

**Architecture:** A daily Vercel cron initiates a merchant-initiated token charge using the **same bookkeeping the invoice flow already uses** (set `pendingPlanId`, store `monoInvoiceId`, reset `activatedInvoiceId = null`). Mono then fires the **existing signed webhook**, which performs idempotent activation. The cron never activates anything itself — it only initiates charges and runs the dunning state machine. That state machine is extracted as a **pure function** (`decideRenewalAction`) so it can be unit-tested with no DB or network.

**Tech Stack:** Next.js 14 App Router (route handlers), Prisma v6 (Postgres/Neon), NextAuth v4, nodemailer (Zoho SMTP), Vitest (new — pure-function unit tests).

## Global Constraints

- **Prisma is v6 — DO NOT UPGRADE.** Schema lives at `src/generated/prisma/schema.prisma` (set via `package.json` `prisma.schema`). Migrate with `npx prisma migrate dev --name <name>`.
- **Pin new dependencies to a major version**, never `@latest`. Vitest pinned to `^3`.
- **NEVER run any git write operation** (add/commit/stage/push). The user does all git in WebStorm. Read-only git is fine. **Steps below that show `git commit` are markers for the user to perform in WebStorm — do not execute them.**
- **NEVER run commands against Vercel.** Env vars and cron are added by the user in the Vercel dashboard; the plan only states what to add.
- **Dev server runs on port 3001** (`npm run dev`), not 3000.
- **Prisma client singleton:** import from `@/lib/prisma`; never instantiate `PrismaClient` elsewhere.
- **`PlanId`** = `"FREE" | "SINGLE" | "MONTHLY" | "YEARLY"` (`src/lib/plans.ts`). Prices in minor units: `PLAN_PRICES` in `src/lib/mono.ts` = `{ SINGLE: 100, MONTHLY: 500, YEARLY: 3900 }`, currency `CCY_EUR = 978`.
- **Mailer is best-effort:** an email failure must NEVER throw or roll back a charge/activation. Every send wrapped in try/catch that only logs.
- **Russian UI uses formal "вы"** (never "ты") and "таролог" (never "гадалка"). Any RU strings added must follow this.
- **Hard prerequisite (manual, gated on ≈2026-06-30):** before this feature can be *verified* (not built), a real MONTHLY/YEARLY payment must store a non-null `Subscription.monoCardToken`. Tokenization was OFF as of 2026-06-28; Mono enabled it, live ~48h later. The engine can be built and unit-tested now; live e2e waits for a stored token.

---

### Task 1: Test infrastructure + pure renewal decision function

The dunning state machine is the highest-value, real-money logic. It is extracted as a pure function with no DB/network so every branch is unit-testable. This task also stands up Vitest (used by later tasks).

**Files:**
- Modify: `package.json` (add `vitest` devDependency + `test` scripts)
- Create: `vitest.config.ts`
- Create: `src/lib/renewal.ts`
- Test: `src/lib/renewal.test.ts`

**Interfaces:**
- Consumes: nothing (self-contained).
- Produces:
  - `type RenewalInput = { autoRenew: boolean; planId: string; expiresAt: Date | null; nextChargeAt: Date | null; monoCardToken: string | null; paymentStatus: string | null; renewalAttempts: number; lastRenewalAttemptAt: Date | null }`
  - `type RenewalAction = { type: "none" } | { type: "downgrade"; reason: "canceled" | "no_token" | "payment_failed" } | { type: "charge" }`
  - `function decideRenewalAction(sub: RenewalInput, now: Date): RenewalAction`
  - `const GRACE_MAX_RETRIES = 3`

- [ ] **Step 1: Install Vitest (pinned to major v3)**

Run:
```bash
npm install -D vitest@^3
```
Expected: `vitest` appears under `devDependencies` in `package.json`, install completes with no peer-dependency errors. Do NOT let it pull or bump Prisma/Next/React.

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block, add the two `test` entries (leave `dev`/`build`/`start`/`lint` unchanged):
```json
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 3: Create `vitest.config.ts`**

The pure function imports nothing from `@/`, but later test tasks (Task 3) import via the `@/` alias, so wire it up now. Node environment (no DOM needed).
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 4: Write the failing test**

Create `src/lib/renewal.test.ts`. These cases cover every branch in spec §7: cancel-lapse, cancel-still-in-period, missing-token-lapse, missing-token-still-in-period, retries-exhausted downgrade, in-flight skip, retry spacing, not-due skip, and a clean due charge.
```ts
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
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './renewal'` / `decideRenewalAction is not a function`.

- [ ] **Step 6: Write the minimal implementation**

Create `src/lib/renewal.ts`. The branch order mirrors spec §7 exactly: cancel → no-token → retries-exhausted → due+spacing.
```ts
// Pure dunning state machine for recurring renewal. No DB, no network, no clock
// access — `now` is injected — so every branch is unit-testable. The cron in
// src/app/api/cron/renew/route.ts loads each MONTHLY/YEARLY subscription and
// applies the action this returns. See docs/superpowers/specs/2026-06-28-recurring-renewal-design.md §7.

export const GRACE_MAX_RETRIES = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type RenewalInput = {
  autoRenew: boolean;
  planId: string;
  expiresAt: Date | null;
  nextChargeAt: Date | null;
  monoCardToken: string | null;
  paymentStatus: string | null;
  renewalAttempts: number;
  lastRenewalAttemptAt: Date | null;
};

export type RenewalAction =
  | { type: "none" }
  | { type: "downgrade"; reason: "canceled" | "no_token" | "payment_failed" }
  | { type: "charge" };

export function decideRenewalAction(sub: RenewalInput, now: Date): RenewalAction {
  const periodOver = sub.expiresAt != null && now >= sub.expiresAt;

  // Canceled: keep access until the period ends, then downgrade.
  if (!sub.autoRenew) {
    return periodOver ? { type: "downgrade", reason: "canceled" } : { type: "none" };
  }

  // No saved token: nothing to charge. Lapse once the period is over.
  if (!sub.monoCardToken) {
    return periodOver ? { type: "downgrade", reason: "no_token" } : { type: "none" };
  }

  // Retries exhausted on a confirmed failure → give up. The retry cap IS the
  // grace boundary (up to GRACE_MAX_RETRIES daily attempts; access continues
  // through them even past expiresAt).
  if (
    sub.renewalAttempts >= GRACE_MAX_RETRIES &&
    (sub.paymentStatus === "failure" || sub.paymentStatus === "reversed")
  ) {
    return { type: "downgrade", reason: "payment_failed" };
  }

  const renewalDue = sub.nextChargeAt != null && now >= sub.nextChargeAt;
  if (!renewalDue) return { type: "none" };

  // A charge is already in flight for the current invoice — never double-charge.
  if (sub.paymentStatus === "created" || sub.paymentStatus === "processing") {
    return { type: "none" };
  }

  // At most one attempt per subscription per day.
  const spacedOk =
    sub.renewalAttempts === 0 ||
    sub.lastRenewalAttemptAt == null ||
    now.getTime() - sub.lastRenewalAttemptAt.getTime() >= DAY_MS;
  if (!spacedOk) return { type: "none" };

  return { type: "charge" };
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 12 assertions green.

- [ ] **Step 8: Commit** *(user performs in WebStorm)*

```bash
git add package.json package-lock.json vitest.config.ts src/lib/renewal.ts src/lib/renewal.test.ts
git commit -m "feat(payments): add Vitest + pure dunning state machine (decideRenewalAction)"
```

---

### Task 2: Migration — four new Subscription fields

**Files:**
- Modify: `src/generated/prisma/schema.prisma` (`Subscription` model)
- Creates (generated): `src/generated/prisma/migrations/<timestamp>_add_renewal_fields/migration.sql`

**Interfaces:**
- Consumes: nothing.
- Produces (new `Subscription` columns, available to all later tasks): `autoRenew Boolean @default(true)`, `canceledAt DateTime?`, `renewalAttempts Int @default(0)`, `lastRenewalAttemptAt DateTime?`.

- [ ] **Step 1: Add the fields to the schema**

In `src/generated/prisma/schema.prisma`, inside `model Subscription`, after the `activatedInvoiceId String?` line, add:
```prisma
  autoRenew            Boolean   @default(true) // false = cancel at period end
  canceledAt           DateTime? // when the user turned off auto-renew
  renewalAttempts      Int       @default(0) // dunning retry counter for the current cycle; reset to 0 on success
  lastRenewalAttemptAt DateTime? // spaces retries to once per day
```

- [ ] **Step 2: Create and apply the migration**

Run:
```bash
npx prisma migrate dev --name add_renewal_fields
```
Expected: a new migration folder `..._add_renewal_fields` is created and applied to the dev (Neon) DB; `prisma generate` re-runs; no errors. Existing rows get `autoRenew = true`, `renewalAttempts = 0`, the two `DateTime?` fields `NULL`.

- [ ] **Step 3: Verify the columns exist**

Run:
```bash
npx prisma migrate status
```
Expected: "Database schema is up to date!" and the new migration listed as applied.

- [ ] **Step 4: Commit** *(user performs in WebStorm)*

```bash
git add src/generated/prisma/schema.prisma src/generated/prisma/migrations
git commit -m "feat(payments): add renewal/dunning fields to Subscription"
```

---

### Task 3: `chargeByToken` in `mono.ts`

Merchant-initiated payment-by-token. Adds the function plus a unit test that mocks `global.fetch` and asserts the exact request shape.

> **Endpoint confirmation (do first):** The path and body below are the spec's expected shape and must be confirmed against the live acquiring OpenAPI (https://api.monobank.ua/docs/acquiring.html) — especially the path (`/api/merchant/wallet/payment`) and `initiationKind: "merchant"`. If the live docs differ, adjust the path/field names in Step 3's implementation only; the test in Step 1 asserts against whatever you implement, so update both together. Architecture is unaffected by the exact names.

**Files:**
- Modify: `src/lib/mono.ts`
- Test: `src/lib/mono.test.ts`

**Interfaces:**
- Consumes: `monoFetch`, `CCY_EUR`, `PLAN_PRICES` (existing exports of `mono.ts`); `process.env.NEXT_PUBLIC_APP_URL`, `process.env.MONO_ACQUIRING_TOKEN`.
- Produces:
  - `type ChargeByTokenParams = { cardToken: string; amount: number; reference: string; destination: string }`
  - `type ChargeByTokenResult = { invoiceId: string; status?: string }`
  - `async function chargeByToken(params: ChargeByTokenParams): Promise<ChargeByTokenResult>`

- [ ] **Step 1: Write the failing test**

Create `src/lib/mono.test.ts`. It mocks `global.fetch` and asserts the path, method, auth header, and JSON body.
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { chargeByToken } from "./mono";

describe("chargeByToken", () => {
  beforeEach(() => {
    process.env.MONO_ACQUIRING_TOKEN = "test-token";
    process.env.NEXT_PUBLIC_APP_URL = "https://theveil.app";
  });
  afterEach(() => vi.restoreAllMocks());

  it("POSTs a merchant-initiated token charge and returns the parsed body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ invoiceId: "inv_1", status: "created" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await chargeByToken({
      cardToken: "tok_abc",
      amount: 500,
      reference: "user1:MONTHLY:renewal:123",
      destination: "The Veil — MONTHLY renewal",
    });

    expect(result).toEqual({ invoiceId: "inv_1", status: "created" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.monobank.ua/api/merchant/wallet/payment");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Token"]).toBe("test-token");

    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      cardToken: "tok_abc",
      amount: 500,
      ccy: 978,
      initiationKind: "merchant",
      merchantPaymInfo: {
        reference: "user1:MONTHLY:renewal:123",
        destination: "The Veil — MONTHLY renewal",
      },
      webHookUrl: "https://theveil.app/api/payments/webhook",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test src/lib/mono.test.ts`
Expected: FAIL — `chargeByToken is not exported`.

- [ ] **Step 3: Implement `chargeByToken`**

Append to `src/lib/mono.ts` (after `verifyMonoWebhook`):
```ts
// ---------------------------------------------------------------------------
// Merchant-initiated recurring charge (payment by saved card token)
//
// Used by the renewal cron to charge a stored card without the user present.
// Drives the SAME signed webhook as invoice/create, so activation stays in one
// place (src/app/api/payments/webhook/route.ts). Endpoint/body confirmed against
// the acquiring OpenAPI: https://api.monobank.ua/docs/acquiring.html
// ---------------------------------------------------------------------------

export type ChargeByTokenParams = {
  cardToken: string;
  amount: number; // minor units (cents)
  reference: string;
  destination: string;
};

export type ChargeByTokenResult = {
  invoiceId: string;
  status?: string;
};

export async function chargeByToken(
  params: ChargeByTokenParams
): Promise<ChargeByTokenResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("[mono] missing NEXT_PUBLIC_APP_URL");
  }

  return monoFetch<ChargeByTokenResult>("/api/merchant/wallet/payment", {
    method: "POST",
    body: JSON.stringify({
      cardToken: params.cardToken,
      amount: params.amount,
      ccy: CCY_EUR,
      initiationKind: "merchant",
      merchantPaymInfo: {
        reference: params.reference,
        destination: params.destination,
      },
      webHookUrl: `${appUrl}/api/payments/webhook`,
    }),
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test src/lib/mono.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit** *(user performs in WebStorm)*

```bash
git add src/lib/mono.ts src/lib/mono.test.ts
git commit -m "feat(payments): add chargeByToken merchant-initiated charge to mono lib"
```

---

### Task 4: Transactional mailer (`src/lib/mailer.ts`)

Three best-effort email senders, reusing the Zoho SMTP / nodemailer setup from `src/app/api/contact/route.ts`. Built before the webhook (Task 5) and cron (Task 6) because both call into it.

**Files:**
- Create: `src/lib/mailer.ts`

**Interfaces:**
- Consumes: `nodemailer` (already a dependency); `process.env.ZOHO_SMTP_USER`, `process.env.ZOHO_SMTP_PASS`.
- Produces (all return `Promise<void>`, never throw):
  - `sendRenewalReceiptEmail(args: { to: string; planId: "MONTHLY" | "YEARLY"; amountMinor: number; expiresAt: Date }): Promise<void>`
  - `sendPaymentFailedEmail(args: { to: string; planId: "MONTHLY" | "YEARLY" }): Promise<void>`
  - `sendSubscriptionEndedEmail(args: { to: string; reason: "canceled" | "payment_failed" | "no_token" }): Promise<void>`

- [ ] **Step 1: Create the mailer**

Create `src/lib/mailer.ts`:
```ts
import nodemailer from "nodemailer";

// Transactional emails for recurring renewal. BEST-EFFORT by contract: every
// send is wrapped so a mail failure can never throw into (and roll back) a
// charge/activation. Reuses the Zoho SMTP setup from the contact route.
// `from` MUST equal the SMTP user — Zoho rejects mismatched envelopes.

function getTransporter(): nodemailer.Transporter | null {
  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASS;
  if (!user || !pass) {
    console.error("[mailer] missing ZOHO_SMTP_USER or ZOHO_SMTP_PASS");
    return null;
  }
  return nodemailer.createTransport({
    host: "smtppro.zoho.eu",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

async function send(subject: string, to: string, text: string): Promise<void> {
  const from = process.env.ZOHO_SMTP_USER;
  const transporter = getTransporter();
  if (!transporter || !from) return; // already logged
  try {
    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    console.error("[mailer] sendMail failed", { subject, err });
  }
}

const PLAN_LABEL: Record<"MONTHLY" | "YEARLY", string> = {
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function formatEuro(amountMinor: number): string {
  return `€${(amountMinor / 100).toFixed(2)}`;
}

export async function sendRenewalReceiptEmail(args: {
  to: string;
  planId: "MONTHLY" | "YEARLY";
  amountMinor: number;
  expiresAt: Date;
}): Promise<void> {
  const text = [
    `Your The Veil ${PLAN_LABEL[args.planId]} subscription has renewed.`,
    "",
    `Amount charged: ${formatEuro(args.amountMinor)}`,
    `Your access now continues until ${args.expiresAt.toISOString().slice(0, 10)}.`,
    "",
    "Manage or cancel your subscription any time in your profile.",
    "— The Veil",
  ].join("\n");
  await send("Your The Veil subscription renewed", args.to, text);
}

export async function sendPaymentFailedEmail(args: {
  to: string;
  planId: "MONTHLY" | "YEARLY";
}): Promise<void> {
  const text = [
    `We couldn't charge your card for your The Veil ${PLAN_LABEL[args.planId]} subscription.`,
    "",
    "We'll automatically try again over the next few days. Your access continues",
    "while we retry. To avoid losing access, please update your card details by",
    "starting a new subscription from your profile.",
    "",
    "— The Veil",
  ].join("\n");
  await send("Payment failed — we'll retry your The Veil subscription", args.to, text);
}

export async function sendSubscriptionEndedEmail(args: {
  to: string;
  reason: "canceled" | "payment_failed" | "no_token";
}): Promise<void> {
  const lead =
    args.reason === "canceled"
      ? "Your The Veil subscription has ended, as requested."
      : "Your The Veil subscription has ended because we couldn't renew your payment.";
  const text = [
    lead,
    "",
    "You're now on the free plan. You can resubscribe any time from your profile",
    "to restore full access.",
    "",
    "— The Veil",
  ].join("\n");
  await send("Your The Veil subscription has ended", args.to, text);
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run: `npm run lint`
Expected: no errors for `src/lib/mailer.ts`. (No unit test: these are thin SMTP wrappers verified by the manual e2e in Task 8.)

- [ ] **Step 3: Commit** *(user performs in WebStorm)*

```bash
git add src/lib/mailer.ts
git commit -m "feat(payments): add transactional mailer (receipt / dunning / ended)"
```

---

### Task 5: Webhook renewal-awareness

Make the existing webhook detect a **renewal** (`pendingPlanId === current planId`, and that plan is MONTHLY/YEARLY) and: extend `expiresAt` from the *prior* period (not `now + interval`, so grace days aren't lost), preserve `startedAt`, reset `renewalAttempts = 0`, and send the per-charge renewal emails. First-time purchases keep today's behavior exactly.

**Files:**
- Modify: `src/app/api/payments/webhook/route.ts`

**Interfaces:**
- Consumes: `sendRenewalReceiptEmail`, `sendPaymentFailedEmail` (Task 4); the new `renewalAttempts` field (Task 2); `PLAN_PRICES` from `@/lib/mono`.
- Produces: no new exports — behavioral change only.

- [ ] **Step 1: Add imports**

At the top of `src/app/api/payments/webhook/route.ts`, alongside the existing imports, add:
```ts
import { PLAN_PRICES } from "@/lib/mono";
import { sendRenewalReceiptEmail, sendPaymentFailedEmail } from "@/lib/mailer";
```

- [ ] **Step 2: Detect the renewal context once, before mutating state**

In `POST`, immediately after the existing line `const pendingPlanId = sub.pendingPlanId;`, add:
```ts
  // Renewal = the activating tier already equals the current tier (a token
  // charge re-buying the same plan), vs a first-time purchase from FREE.
  // Captured BEFORE we clear pendingPlanId on the failure branch.
  const isRenewal =
    (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY") &&
    pendingPlanId === sub.planId;
```

- [ ] **Step 3: Make the success branch renewal-aware**

In the `if (status === "success")` block, replace the existing MONTHLY/YEARLY handling. Find this current code:
```ts
    } else if (pendingPlanId === "MONTHLY") {
      const expiresAt = addMonths(now, 1);
      data.planId = "MONTHLY";
      data.startedAt = now;
      data.expiresAt = expiresAt;
      data.nextChargeAt = expiresAt;
    } else if (pendingPlanId === "YEARLY") {
      const expiresAt = addYears(now, 1);
      data.planId = "YEARLY";
      data.startedAt = now;
      data.expiresAt = expiresAt;
      data.nextChargeAt = expiresAt;
    } else {
```
and replace it with:
```ts
    } else if (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY") {
      // Renewals extend from the PRIOR expiresAt (preserving the billing anchor
      // and any grace days); first-time purchases start a fresh period at `now`.
      const base = isRenewal && sub.expiresAt ? sub.expiresAt : now;
      const expiresAt =
        pendingPlanId === "MONTHLY" ? addMonths(base, 1) : addYears(base, 1);
      data.planId = pendingPlanId;
      data.expiresAt = expiresAt;
      data.nextChargeAt = expiresAt;
      if (isRenewal) {
        // Successful renewal clears the dunning counter; keep original startedAt.
        data.renewalAttempts = 0;
      } else {
        data.startedAt = now;
      }
    } else {
```

- [ ] **Step 4: Send the renewal-receipt email after a successful renewal**

Still in the `if (status === "success")` block, find the ledger line near the end:
```ts
    // Ledger: record success unconditionally (success is never a downgrade).
    await updatePaymentLedger("success", false);
    return NextResponse.json({ ok: true });
```
and insert the email send **before** `return`, so the block becomes:
```ts
    // Ledger: record success unconditionally (success is never a downgrade).
    await updatePaymentLedger("success", false);

    // Renewal receipt (best-effort; never blocks the ack). Only in the renewal
    // context — first-time buyers saw the result live on Mono's page. Guarded by
    // count > 0 so a duplicate delivery (already-applied) doesn't re-email.
    if (isRenewal && count > 0 && (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY")) {
      const user = await prisma.user.findUnique({
        where: { id: sub.userId },
        select: { email: true },
      });
      if (user?.email) {
        await sendRenewalReceiptEmail({
          to: user.email,
          planId: pendingPlanId,
          amountMinor: payload.amount ?? PLAN_PRICES[pendingPlanId],
          expiresAt: addMonths(
            isRenewal && sub.expiresAt ? sub.expiresAt : now,
            pendingPlanId === "MONTHLY" ? 1 : 12
          ),
        });
      }
    }
    return NextResponse.json({ ok: true });
```
> Note: `addMonths(base, 12)` equals `addYears(base, 1)`; reusing `addMonths` here keeps the email's expiry in one expression. The authoritative `expiresAt` written to the DB is still the Step 3 value.

- [ ] **Step 5: Send the dunning email after a renewal failure**

In the `if (status === "failure" || status === "reversed")` block, find:
```ts
    // Ledger: terminal status, mirrors Subscription (applied unconditionally).
    await updatePaymentLedger(status, false);
    return NextResponse.json({ ok: true });
```
and insert the dunning email **before** `return`:
```ts
    // Ledger: terminal status, mirrors Subscription (applied unconditionally).
    await updatePaymentLedger(status, false);

    // Dunning email (best-effort) only for renewal failures — first-time
    // purchase failures were shown live on Mono's page.
    if (isRenewal && (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY")) {
      const user = await prisma.user.findUnique({
        where: { id: sub.userId },
        select: { email: true },
      });
      if (user?.email) {
        await sendPaymentFailedEmail({ to: user.email, planId: pendingPlanId });
      }
    }
    return NextResponse.json({ ok: true });
```

- [ ] **Step 6: Verify lint + existing tests still pass**

Run: `npm run lint && npm test`
Expected: no lint errors; the Task 1 + Task 3 unit tests still pass (this task is verified end-to-end manually in Task 8 — webhook behavior needs a real signed delivery).

- [ ] **Step 7: Commit** *(user performs in WebStorm)*

```bash
git add src/app/api/payments/webhook/route.ts
git commit -m "feat(payments): make webhook renewal-aware (extend period, dunning emails)"
```

---

### Task 6: Renewal cron route + dunning execution

The daily job. Loads every MONTHLY/YEARLY subscription, asks `decideRenewalAction` what to do, and applies it: downgrade (+ ended email) or initiate a token charge (reserve the attempt, charge, store invoice id, write ledger row). The webhook (Task 5) confirms the outcome asynchronously.

**Files:**
- Create: `src/app/api/cron/renew/route.ts`

**Interfaces:**
- Consumes: `decideRenewalAction` (Task 1); `chargeByToken`, `PLAN_PRICES` (Task 3); `sendSubscriptionEndedEmail` (Task 4); the new dunning fields (Task 2); `process.env.CRON_SECRET`.
- Produces: a `GET` route handler at `/api/cron/renew`.

- [ ] **Step 1: Create the route**

Create `src/app/api/cron/renew/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeByToken, PLAN_PRICES } from "@/lib/mono";
import { decideRenewalAction } from "@/lib/renewal";
import { sendSubscriptionEndedEmail } from "@/lib/mailer";

// Daily renewal cron. Vercel attaches `Authorization: Bearer ${CRON_SECRET}`
// automatically when CRON_SECRET is set, so we reject anything else — without
// this, anyone hitting the URL could trigger real charges. The cron NEVER
// activates anything itself: it initiates token charges (driving the existing
// signed webhook) and runs the dunning state machine. See spec §7/§8.

export const dynamic = "force-dynamic";

async function downgradeToFree(
  subId: string,
  userId: string,
  reason: "canceled" | "payment_failed" | "no_token"
): Promise<void> {
  await prisma.subscription.update({
    where: { id: subId },
    data: { planId: "FREE", nextChargeAt: null },
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (user?.email) {
    await sendSubscriptionEndedEmail({ to: user.email, reason });
  }
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const subs = await prisma.subscription.findMany({
    where: { planId: { in: ["MONTHLY", "YEARLY"] } },
  });

  let charged = 0;
  let downgraded = 0;

  for (const sub of subs) {
    const action = decideRenewalAction(
      {
        autoRenew: sub.autoRenew,
        planId: sub.planId,
        expiresAt: sub.expiresAt,
        nextChargeAt: sub.nextChargeAt,
        monoCardToken: sub.monoCardToken,
        paymentStatus: sub.paymentStatus,
        renewalAttempts: sub.renewalAttempts,
        lastRenewalAttemptAt: sub.lastRenewalAttemptAt,
      },
      now
    );

    if (action.type === "none") continue;

    if (action.type === "downgrade") {
      try {
        await downgradeToFree(sub.id, sub.userId, action.reason);
        downgraded++;
      } catch (err) {
        console.error(`[cron/renew] downgrade failed for sub ${sub.id}`, err);
      }
      continue;
    }

    // action.type === "charge": a paid plan with a token. Narrow the type.
    const plan = sub.planId as "MONTHLY" | "YEARLY";
    const token = sub.monoCardToken;
    if (!token) continue; // defensive; decideRenewalAction already guarantees it

    // Reserve the attempt FIRST, using the same bookkeeping as create-invoice:
    // set pendingPlanId, reset activatedInvoiceId, mark paymentStatus "created"
    // (so a concurrent run sees an in-flight charge and skips), bump the counter.
    try {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          pendingPlanId: plan,
          activatedInvoiceId: null,
          paymentStatus: "created",
          renewalAttempts: { increment: 1 },
          lastRenewalAttemptAt: now,
        },
      });
    } catch (err) {
      console.error(`[cron/renew] failed to reserve attempt for sub ${sub.id}`, err);
      continue;
    }

    const reference = `${sub.userId}:${plan}:renewal:${now.getTime()}`;
    let invoiceId: string;
    try {
      const res = await chargeByToken({
        cardToken: token,
        amount: PLAN_PRICES[plan],
        reference,
        destination: `The Veil — ${plan} renewal`,
      });
      invoiceId = res.invoiceId;
    } catch (err) {
      // Charge initiation failed (network/API). Mark the attempt failed so the
      // state machine retries tomorrow; leave the bumped counter in place.
      console.error(`[cron/renew] chargeByToken failed for sub ${sub.id}`, err);
      await prisma.subscription
        .update({ where: { id: sub.id }, data: { paymentStatus: "failure" } })
        .catch((e) => console.error(`[cron/renew] failed to mark failure for sub ${sub.id}`, e));
      continue;
    }

    // Store the invoice id so the webhook can correlate the callback, and write
    // the ledger row (best-effort). The webhook is the source of truth for the
    // outcome (period extension, receipt/dunning email).
    await prisma.subscription
      .update({ where: { id: sub.id }, data: { monoInvoiceId: invoiceId } })
      .catch((e) => console.error(`[cron/renew] failed to store invoiceId for sub ${sub.id}`, e));

    await prisma.payment
      .create({
        data: {
          userId: sub.userId,
          monoInvoiceId: invoiceId,
          reference,
          productType: plan,
          amount: PLAN_PRICES[plan],
          currency: "EUR",
          status: "created",
        },
      })
      .catch((e) => console.error(`[cron/renew] failed to write ledger row for sub ${sub.id}`, e));

    charged++;
  }

  return NextResponse.json({ ok: true, scanned: subs.length, charged, downgraded });
}
```

- [ ] **Step 2: Verify lint + type-check**

Run: `npm run lint`
Expected: no errors. (Behavioral verification is the manual e2e in Task 8; the decision logic it relies on is already unit-tested in Task 1.)

- [ ] **Step 3: Commit** *(user performs in WebStorm)*

```bash
git add src/app/api/cron/renew/route.ts
git commit -m "feat(payments): add daily renewal cron + dunning execution"
```

---

### Task 7: Cancellation endpoint + UserProfile button + i18n

Lets a user toggle auto-renew (cancel at period end / resume). Extends `getSubscriptionStatus` so the profile can show the renewal date and current auto-renew state.

**Files:**
- Modify: `src/lib/subscription.ts` (extend `SubscriptionStatus` + `getSubscriptionStatus`)
- Create: `src/app/api/user/subscription/route.ts`
- Modify: `src/components/UserProfile.tsx`
- Modify: `messages/en/ui.json`, `messages/no/ui.json`, `messages/ru/ui.json`, `messages/uk/ui.json`, `messages/tr/ui.json`

**Interfaces:**
- Consumes: the new `autoRenew`/`canceledAt`/`expiresAt` fields (Task 2); existing `getServerSession`/`authOptions`/`prisma` patterns (mirrors `src/app/api/user/reader/route.ts`).
- Produces:
  - Extended `SubscriptionStatus` with `expiresAt: string | null` and `autoRenew: boolean`.
  - `PATCH /api/user/subscription` accepting `{ autoRenew: boolean }`, returning `{ autoRenew, canceledAt }`.

- [ ] **Step 1: Extend `SubscriptionStatus` and `getSubscriptionStatus`**

In `src/lib/subscription.ts`, update the `SubscriptionStatus` type to add two fields:
```ts
export type SubscriptionStatus = {
  planId: PlanId;
  readingCredits: number;
  /** Last Mono status string ("created" | "processing" | "success" | "failure" | "reversed" | null). */
  paymentStatus: string | null;
  /** The purchase in flight, if any ("SINGLE" | "MONTHLY" | "YEARLY"); cleared once settled. */
  pendingPlanId: string | null;
  /** ISO date the current paid period ends, or null. */
  expiresAt: string | null;
  /** Whether the subscription auto-renews (false = canceled at period end). */
  autoRenew: boolean;
};
```
Then in `getSubscriptionStatus`, add the two fields to the `select` and the returned object (both the success and the catch path):
```ts
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        planId: true,
        readingCredits: true,
        paymentStatus: true,
        pendingPlanId: true,
        expiresAt: true,
        autoRenew: true,
      },
    });
    return {
      planId: (sub?.planId as PlanId | undefined) ?? "FREE",
      readingCredits: sub?.readingCredits ?? 0,
      paymentStatus: sub?.paymentStatus ?? null,
      pendingPlanId: sub?.pendingPlanId ?? null,
      expiresAt: sub?.expiresAt ? sub.expiresAt.toISOString() : null,
      autoRenew: sub?.autoRenew ?? true,
    };
```
And in the `catch` block's fallback return, add the two new fields:
```ts
    return {
      planId: "FREE",
      readingCredits: 0,
      paymentStatus: null,
      pendingPlanId: null,
      expiresAt: null,
      autoRenew: true,
    };
```

- [ ] **Step 2: Create the cancellation endpoint**

Create `src/app/api/user/subscription/route.ts` (mirrors the auth pattern in `src/app/api/user/reader/route.ts`):
```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Toggle auto-renew. Cancellation is "at period end": autoRenew=false keeps
// access until expiresAt; the daily cron downgrades to FREE once the period
// ends. Re-enabling clears canceledAt and resumes normal renewal.
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let autoRenew: unknown;
  try {
    ({ autoRenew } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof autoRenew !== "boolean") {
    return NextResponse.json({ error: "Invalid autoRenew" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { planId: true },
  });
  if (!sub || (sub.planId !== "MONTHLY" && sub.planId !== "YEARLY")) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 }
    );
  }

  const updated = await prisma.subscription.update({
    where: { userId: session.user.id },
    data: {
      autoRenew,
      canceledAt: autoRenew ? null : new Date(),
    },
    select: { autoRenew: true, canceledAt: true },
  });

  return NextResponse.json({
    autoRenew: updated.autoRenew,
    canceledAt: updated.canceledAt ? updated.canceledAt.toISOString() : null,
  });
}
```

- [ ] **Step 3: Add the i18n keys**

Add these keys to the `"ui"` object in **all five** locale files. Use the English values below for `en`. For `no`, `uk`, `tr`, add the **same keys with the English text as placeholder** (consistent with the project's partial-locale convention — they can be translated later). For `ru`, use the Russian values shown (formal "вы"):

`messages/en/ui.json` — add:
```json
    "renewsOn": "Renews on {date}",
    "accessUntil": "Access until {date}",
    "cancelSubscription": "Cancel subscription",
    "resumeSubscription": "Resume subscription",
    "subscriptionCanceledNotice": "Auto-renew is off. Your access continues until {date}.",
    "cancelSubscriptionConfirm": "Cancel auto-renew? You'll keep access until the end of your paid period."
```

`messages/ru/ui.json` — add (formal "вы"):
```json
    "renewsOn": "Продление {date}",
    "accessUntil": "Доступ до {date}",
    "cancelSubscription": "Отменить подписку",
    "resumeSubscription": "Возобновить подписку",
    "subscriptionCanceledNotice": "Автопродление отключено. Доступ сохраняется до {date}.",
    "cancelSubscriptionConfirm": "Отключить автопродление? Доступ сохранится до конца оплаченного периода."
```

`messages/no/ui.json`, `messages/uk/ui.json`, `messages/tr/ui.json` — add the same six keys with the English values from the `en` block above as placeholders.

> Verify each file stays valid JSON (trailing commas matter — insert these before the closing brace of the `"ui"` object, adding/removing the comma on the preceding line as needed).

- [ ] **Step 4: Wire the button into UserProfile**

In `src/components/UserProfile.tsx`:

(a) Replace the plan-loading state and effect. Find:
```ts
  const [planId, setPlanId] = useState<PlanId | null>(null);
```
and add two more state vars right after it:
```ts
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [subSaving, setSubSaving] = useState(false);
```

(b) Extend the existing `loadPlan` effect to also capture the new fields. Find:
```ts
        if (res.ok) {
          const data = await res.json();
          setPlanId(data.planId as PlanId);
        }
```
and replace with:
```ts
        if (res.ok) {
          const data = await res.json();
          setPlanId(data.planId as PlanId);
          setExpiresAt(data.expiresAt ?? null);
          setAutoRenew(data.autoRenew ?? true);
        }
```

(c) Add a handler (place it next to the other `handle*` functions, e.g. after `handleSelectLocale`):
```ts
  const handleToggleAutoRenew = async () => {
    if (subSaving) return;
    // Turning auto-renew OFF asks for confirmation; turning it back ON does not.
    if (autoRenew && !window.confirm(t("cancelSubscriptionConfirm"))) return;
    setSubSaving(true);
    try {
      const res = await fetch("/api/user/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRenew: !autoRenew }),
      });
      if (res.ok) {
        const data = await res.json();
        setAutoRenew(data.autoRenew);
      }
    } catch {
      // silent — user can retry
    } finally {
      setSubSaving(false);
    }
  };
```

(d) Add the subscription controls. Find the current-plan field:
```tsx
      <div className="user-profile__field">
        <span className="user-profile__label">{t("currentPlan")}</span>
        <span className="user-profile__value">
          {planId ? tPlans(`${planId}.name`) : "—"}
          <Link href="/subscription" className="user-profile__upgrade">
            {"→ " + t("initiation")}
          </Link>
        </span>
      </div>
```
and insert this block **immediately after** it (only renders for active recurring plans):
```tsx
      {(planId === "MONTHLY" || planId === "YEARLY") && (
        <div className="user-profile__field">
          <span className="user-profile__label">{t("currentPlan")}</span>
          <span className="user-profile__value">
            {expiresAt
              ? (autoRenew ? t("renewsOn", { date: expiresAt.slice(0, 10) })
                           : t("accessUntil", { date: expiresAt.slice(0, 10) }))
              : "—"}
            <button
              type="button"
              className="user-profile__upgrade"
              onClick={handleToggleAutoRenew}
              disabled={subSaving}
            >
              {"→ " + (autoRenew ? t("cancelSubscription") : t("resumeSubscription"))}
            </button>
          </span>
        </div>
      )}
```

- [ ] **Step 5: Verify lint + manual smoke**

Run: `npm run lint`
Expected: no errors.
Then run `npm run dev` (port 3001), open the profile while logged in as a MONTHLY/YEARLY user (you can set this via `npx prisma studio` for a test user), and confirm: the renewal date shows, "Cancel subscription" toggles to "Resume subscription", and the DB row's `autoRenew`/`canceledAt` update.

- [ ] **Step 6: Commit** *(user performs in WebStorm)*

```bash
git add src/lib/subscription.ts src/app/api/user/subscription/route.ts src/components/UserProfile.tsx messages
git commit -m "feat(payments): add cancel/resume auto-renew (endpoint + profile + i18n)"
```

---

### Task 8: Cron wiring (`vercel.json` + `CRON_SECRET`) and end-to-end verification

Schedules the daily cron and documents the env var. Ends with the manual e2e from spec §11 (gated on the tokenization prerequisite).

**Files:**
- Create: `vercel.json`
- Modify: `.env.example`

**Interfaces:**
- Consumes: the cron route from Task 6.
- Produces: a daily Vercel cron hitting `/api/cron/renew`; the `CRON_SECRET` env var contract.

- [ ] **Step 1: Create `vercel.json`**

Create `vercel.json` at the repo root:
```json
{
  "crons": [
    {
      "path": "/api/cron/renew",
      "schedule": "0 6 * * *"
    }
  ]
}
```
(Daily at 06:00 UTC. Vercel automatically attaches `Authorization: Bearer ${CRON_SECRET}` to the invocation when the env var is set.)

- [ ] **Step 2: Document `CRON_SECRET` in `.env.example`**

Append to `.env.example`:
```bash
# Secret the renewal cron endpoint (/api/cron/renew) requires as a Bearer token.
# Vercel attaches it automatically to cron invocations. Generate with:
#   openssl rand -base64 32
CRON_SECRET=""
```

- [ ] **Step 3: Set `CRON_SECRET` locally and in Vercel** *(user action — do not run against Vercel)*

- Add `CRON_SECRET="<openssl rand -base64 32 output>"` to local `.env` / `.env.local`.
- **In the Vercel dashboard** (Project → Settings → Environment Variables), add `CRON_SECRET` as **Sensitive** for Production. *(The assistant must not touch Vercel; the user does this in the dashboard.)*

- [ ] **Step 4: Commit** *(user performs in WebStorm)*

```bash
git add vercel.json .env.example
git commit -m "feat(payments): schedule daily renewal cron + document CRON_SECRET"
```

- [ ] **Step 5: Local cron smoke test (no real money)**

With `npm run dev` running and a test subscription whose `nextChargeAt` is in the **past** but `monoCardToken` left `null` (so `decideRenewalAction` returns `none`/`downgrade`, never a real charge):
```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" http://localhost:3001/api/cron/renew
```
Expected: `200` with `{ "ok": true, "scanned": N, "charged": 0, "downgraded": ... }`. Then:
```bash
curl -i http://localhost:3001/api/cron/renew
```
Expected: `401 Unauthorized` (no bearer).

- [ ] **Step 6: Full e2e — GATED on the tokenization prerequisite (≈2026-06-30+)**

Only once a real MONTHLY/YEARLY payment has stored a non-null `monoCardToken` (verify via `npx prisma studio`):
1. Point the webhook at your dev server via a tunnel (e.g. `ngrok http 3001`) and set `NEXT_PUBLIC_APP_URL` to the tunnel origin so `chargeByToken`'s `webHookUrl` is reachable.
2. Set the test subscription's `nextChargeAt` to the past, `autoRenew=true`, `paymentStatus="success"`, `renewalAttempts=0`.
3. `curl` the cron with the bearer. Confirm: a charge is initiated → the signed webhook lands → `expiresAt` extends from the prior period → `renewalAttempts` resets to 0 → a renewal-receipt email arrives.
4. To exercise dunning, simulate a decline (Mono test card or a failing token) and confirm: `paymentStatus="failure"` → dunning email → next run retries (once/day) → after `GRACE_MAX_RETRIES` the cron downgrades to FREE and sends the ended email.
> This spends real money on a live token — refund test charges from the Mono cabinet. Consider a Mono **test** acquiring token for repeatable runs.

- [ ] **Step 7: Update status docs** *(then commit in WebStorm)*

Mark the renewal items done in `docs/go-live.md` (§"Recurring") and the Payments section of `TODO.md`, noting the e2e result.

---

## Self-Review

**Spec coverage (§ by §):**
- §4 reuse-the-webhook approach → Task 6 (cron only initiates) + Task 5 (webhook activates). ✓
- §5 components: `chargeByToken` → Task 3; cron route → Task 6; `vercel.json` → Task 8; cancellation → Task 7; mailer → Task 4; webhook changes → Task 5. ✓
- §6 data model (4 fields) → Task 2; webhook renewal-awareness (extend-from-prior, preserve startedAt, reset attempts, emails) → Task 5. ✓
- §7 dunning state machine → Task 1 (pure fn, all branches) + Task 6 (application). ✓
- §8 idempotency: in-flight skip (`paymentStatus` created/processing) in Task 1; reset `paymentStatus="created"` + fresh `monoInvoiceId` per attempt + `activatedInvoiceId=null` in Task 6; retry spacing via `lastRenewalAttemptAt` in Task 1; endpoint `CRON_SECRET` guard in Task 6/8. ✓
- §9 cancellation (PATCH + at-period-end + UserProfile button) → Task 7. ✓
- §10 `CRON_SECRET` → Task 8. ✓
- §11 testing: Vitest unit tests → Tasks 1 & 3; idempotency covered by Task 1 branches; manual e2e → Task 8 Steps 5–6. ✓
- §13 build order: reordered only to satisfy dependencies (mailer before webhook, since the webhook calls it) — noted in Task 4. ✓

**Placeholder scan:** No TBD/“add error handling”/“similar to Task N”. Every code step shows complete code; every command shows expected output.

**Type consistency:** `decideRenewalAction(sub: RenewalInput, now: Date): RenewalAction` and `GRACE_MAX_RETRIES` consistent across Tasks 1 and 6. `chargeByToken(params: ChargeByTokenParams): Promise<ChargeByTokenResult>` consistent across Tasks 3 and 6. `SubscriptionStatus` additions (`expiresAt`, `autoRenew`) consistent across Tasks 7 (lib) and 7 (UserProfile). Mailer signatures consistent across Tasks 4, 5, 6. New Prisma fields (`autoRenew`, `canceledAt`, `renewalAttempts`, `lastRenewalAttemptAt`) defined in Task 2 and read/written in Tasks 5, 6, 7.

**Open risk carried from spec §12:** the exact Mono token-charge endpoint/body (`/api/merchant/wallet/payment`, `initiationKind: "merchant"`) must be confirmed against the live OpenAPI during Task 3 — flagged inline there.
