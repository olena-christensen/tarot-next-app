# Currency and fiscal receipts

Why prices say euro and the card is charged in hryvnia, and why that is not optional.

## The failure, 2026-08-05 → 2026-08-07

Invoices were created with `ccy` 978 (euro). Ukrainian fiscal receipts and monobank's
automatic bank integration only fiscalize **980 (hryvnia)**.

A 978 invoice is accepted. The card is charged. monobank simply never emits the
fiscalization request — so nothing reaches Checkbox, no receipt exists, and nothing errors
anywhere. Checkbox support confirmed they saw no traffic at all, which read like a monobank
outage rather than a request that was never made.

Three days. monobank support found it. Their own documentation says `ccy` defaults to 980,
which is the tell in hindsight.

**If receipts ever stop arriving, check the currency code before anything else.**

## The fix

Charge in hryvnia, keep advertising in euros. The audience is European; hryvnia price tags
read as a foreign, riskier product, so the label did not move.

`src/lib/mono.ts` holds all of it:

- `CCY_UAH = 980`. `CCY_EUR` was **deleted** rather than aliased, so any missed usage is a
  compile error instead of a silent euro invoice.
- `PLAN_PRICES` in kopiykas: ₴52.50 / ₴262.50 / ₴2047.50.
- `PLAN_PRICES_EUR` — the display figures, 1 / 5 / 39.
- `PEG_EUR_UAH = 52.5`, set against monobank's sell rate of 52.07 on 2026-08-07, rounded up
  for margin.

**Re-pegging:** when the real rate drifts more than about 5%, change `PEG_EUR_UAH` and all
three `PLAN_PRICES` together. monobank's own rate is at
`https://api.monobank.ua/bank/currency` (currencyCodeA 978, currencyCodeB 980). Nothing
else needs touching.

A fixed peg rather than a live rate looked up per invoice: a live rate puts a network call
in the payment path, makes every renewal a different amount, and makes the ledger
impossible to reconcile by eye. The cost is drift.

## What else the change touched

- Receipt email prints **both** figures — €5.00 (₴262.50). It previously formatted whatever
  `PLAN_PRICES` held with a euro sign, which after the change would have read "€262.50".
  The receipt has to agree with the customer's bank statement.
- Checkout disclosure in all five locales (`ui.chargedInHryvnia`): charged in hryvnia at a
  fixed rate, the customer's bank converts back and may add a fee. Required, not decorative
  — the figure on their statement will not match the figure on the page.
- Ledger rows record `UAH` via `LEDGER_CURRENCY`.

## The two tests that matter

Nothing in the interface can reveal a drift between the euro label and the hryvnia charge —
the charge is in a currency no screen shows. A customer could see €5 and be billed €7 with
no visible clue.

- `mono.test.ts` — each hryvnia price equals its euro label × the peg.
- `plans.test.ts` — `priceLabel` matches `PLAN_PRICES_EUR`.

## Verified

**2026-08-07:** €1 SINGLE purchase on theveil.app → ₴52.50 charged → fiscal receipt issued
by Checkbox and registered with the tax service.

**Not yet observed:** a token-charge renewal fiscalizing. Same code path, same currency, but
it cannot be forced — it happens when a subscription actually falls due.

## Next suspect if a receipt goes missing

monobank's `basketOrder` schema lists `total` as required on each line; we send only `sum`.
Not enforced at invoice creation — invoices succeed without it — but fiscalization is
exactly where a malformed basket line would bite.
