---
name: new-product
description: Playbook for launching another product under the Nothing Weird umbrella (Olena Christensen, Individual Entrepreneur). Use when starting a new product, planning its build order, deciding what can be reused from an existing one, or judging whether a product is ready to take money or ready to launch. Covers what the umbrella already provides so it is never rebuilt, the decisions that must be settled before code, the build order, and the gates that must be true before each step.
---

# Launching another product under the umbrella

The first product cost months, and most of that was not the product. It was the entity, the
bank, the tax receipts, the legal pages, the monitoring, the email. **That work is done and
belongs to the umbrella, not to any one product.** The second product should be mostly
product.

The job of this skill is to stop the owner paying for the same lessons twice.

## Order of work

**1. Decide, before writing anything.** Read `references/decisions.md` and get real answers.
Every one of those questions has already cost money once by being answered late or by
default. Do not start building to find out.

**2. Take stock of what exists.** Read `references/umbrella-assets.md`. Anything listed
there is reuse, not rebuild. Rebuilding it is the single most expensive mistake available.

**3. Seed the task list.** Create `docs/STATUS.md` from
`.claude/skills/task-doc/references/new-product-todo.md`, and follow
`.claude/skills/task-doc/SKILL.md` for how to write in it. Delete what does not apply.

**4. Build in this order.** Each phase has a gate in `references/launch-gates.md` that must
be true before the next one starts.

- Product core — the thing itself, no accounts, no payments, no locales.
- Accounts — sign-in, profile, delete, export.
- Payments — invoice, webhook, reconcile, tax receipt.
- Platform — rate limits, error pages, alerts, heartbeats, health endpoint.
- Content — public pages a search engine can read.
- Launch.

Do not build payments before the product works. Do not launch before the platform phase.
Both were done in the wrong order once and both had to be revisited.

## Rules that come from real failures

**Verify on production, not on a test key.** Tokenization, renewal, dunning, tax receipts
and file uploads each behaved differently on a real deployment. Anything touching disk,
money, or a third party is unproven until it has run live.

**Nothing is done until it has failed loudly once.** A job that has never been seen to fail
has never been seen to report. Break it on purpose and check the email arrives.

**Every claim on the pricing page is a promise.** Audit the copy against the code before
launch, and mark anything not built as coming soon. An advertised feature that does not
exist is the one bug a customer will not forgive.

**One legal name, everywhere.** Pick it once and never vary it across the entity, the
receipts, the legal pages and the payment provider.

**Charge in the currency the tax authority needs**, then decide separately what the price
tag says. These are two different questions and conflating them cost three days.

## Reuse from The Veil

`~/Projects/tarot-next-app` is the reference implementation. Copy the patterns, not the
prose:

- `src/lib/mono.ts` — acquiring, currency, price pegging.
- `src/lib/paymentActivation.ts` — the one place a payment outcome is applied.
- `src/lib/cronJob.ts` — crash guard for scheduled jobs.
- `src/lib/heartbeat.ts` and `src/lib/alert.ts` — the dead-man's switch.
- `src/app/api/health` — the liveness probe.
- `src/lib/rateLimit.ts` — throttling that fails open.
- `src/lib/seo.ts` — canonical links and alternates.
- `src/app/{privacy,terms,cookie-policy,refund}` — legal pages, self-hosted.
- `docs/features/` — how each of the above went wrong the first time.

## When the answer is "do not build this yet"

A second product competes with the first for the only resource that is actually scarce,
which is the owner's attention. Before starting, say plainly what the first product still
needs and what it will cost to leave it alone. That is a real answer, not obstruction.
