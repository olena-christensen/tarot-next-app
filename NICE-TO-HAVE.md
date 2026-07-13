# Nice to have — post-launch

Not real work. This is stuff to consider only **after** launch, when the product
is live and there's genuinely nothing else on the plate. Keep it out of `TODO.md`.

- **Currency presentation.** We advertise prices in EUR (€1/€5/€39), but monobank settles in UAH, so EU customers see the converted hryvnia amount (~254 UAH for €5) on their statements, not euros. Two parts: (1) ask Mono whether EUR settlement is possible — a bank/account question, not code; (2) if not, add a small "charged in UAH at today's rate" disclosure at checkout / on the receipt.
- **"readings left today" indicator** on the main page; in-app currency / "crystals" packs (consume path already decrements a generic balance — a pricing change, not a rebuild).
- **Reconciliation sweep back to hourly.** The `/api/cron/reconcile` sweep is currently daily (`0 3 * * *`) because the Vercel Hobby plan forbids sub-daily crons — a stuck payment is recovered within ~24h. If we ever move to Vercel Pro ($20/mo, allows per-minute crons), bump the schedule in `vercel.json` back to hourly (`0 * * * *`) so a lost-webhook payment lands within ~1h instead. Only worth it once payment volume justifies the plan cost; the webhook is the primary path and daily is a fine backstop for low volume.

## Ideas

- Login modal loader — "pulling you into hell" themed entrance animation
- Card flip animation — highlight cards one by one when ready for flipping
- Spooky background sound during app loading animation
- Footer — animation for highlighted items
- User profile page
