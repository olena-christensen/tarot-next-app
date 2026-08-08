# What the umbrella already provides

Anything here is **reuse, not rebuild**. Rebuilding it is the most expensive mistake
available on a second product.

## Already solved once, forever

**Legal entity.** Olena Christensen, Individual Entrepreneur — registered in Ukraine.
Trade name: Nothing Weird. A new product is a new trade name under the same entity, not a
new registration.

**Acquiring.** Plata by mono (JSC Universal Bank), acquiring API v2410. One merchant
account. A second product needs its own line items and reference format, not a second
bank relationship.

**Tax receipts.** Trading point, register and cashier are registered with the tax office;
Checkbox is connected to the mono terminal. **Invoices must be created in currency code 980
(hryvnia)** or no receipt is ever issued and nothing errors — see
`docs/features/currency-and-fiscal-receipts.md` in the tarot project.

**Email.** `nothingweird.agency` on Zoho, with the aliases privacy@, legal@, billing@ and
support@ already routing. Sending limit is 50–500 external messages per hour, reputation
based, not visible in the settings. A second product shares that ceiling.

**Hosting.** Vercel Pro — commercial use permitted, cron jobs unrestricted. A new product
is a new project in the same account.

**Database.** Neon Postgres. The free plan gives 100 compute-unit-hours per project per
month and suspends the compute when they run out. A second product means a second project
and a second allowance — but also a second thing that can silently sleep.

**Legal pages.** Privacy, terms, cookie policy and refund policy exist as self-hosted
pages, free of any third-party generator's markup, with the legal-name standard applied.
Copy and adapt; do not start from a generator again.

## Reusable code patterns

Listed in the skill body. All live in `~/Projects/tarot-next-app/src/lib/`.

## What is genuinely per-product

- Domain, and its email records if the product sends mail from its own domain.
- Vercel project, environment variables, and the acquiring token if a separate one is used.
- Neon project.
- Uptime monitor entries — one for the site, one for the health endpoint.
- Trade name and the copy on every legal page that names the service.
- The product itself.

## Shared ceilings to watch

These are umbrella-wide, so a second product eats into the first product's headroom:

- Zoho's hourly send limit is per account, not per product.
- The owner's attention. This is the binding constraint and it is not listed anywhere else.
