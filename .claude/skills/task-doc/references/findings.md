# Traps already paid for

Each of these cost real time on The Veil. They are not general wisdom; they are specific
failures with specific symptoms. Check them on the next product before they happen again.

## Payments

**The tax-receipt currency is not the display currency.** Ukrainian fiscal receipts and
monobank's bank integration only fiscalize invoices in code 980 (hryvnia). An invoice in
978 (euro) is accepted, the card is charged, and no fiscalization request is ever sent —
nothing errors, no receipt exists, and the receipt provider sees no traffic at all. Three
days to find. If receipts never arrive, check the currency code first. Prices can still be
advertised in another currency; peg them and disclose the charge currency at checkout.

**Never activate a tier before the webhook confirms it.** Record what the user is trying to
buy; grant nothing until the signed callback says success.

**A late intermediate status will overwrite a terminal one** unless the no-downgrade guard
is in the database write itself. A read-then-write loses the race.

**Poll for payments whose webhook never arrived.** Push alone drifts. Poll through the same
code path the webhook uses, or the two states diverge.

**An abandoned checkout must be terminal.** Otherwise it stays "in flight" forever and gets
re-polled every day.

## Scheduled jobs

**A job that reports at the end of its run reports nothing when it crashes.** Wrap the body
so a thrown error still sends the alert. Found when a database outage killed three
consecutive runs in total silence.

**Heartbeats in the same database as the job cannot record a database outage.** The internal
watchman is blind exactly when it matters. An external monitor is the only cover.

**An uptime monitor pointed at the home page stays green through a total database outage.**
Point it at an endpoint that runs a real query.

**A stale-job alert repeating hourly is noise, not alerting.** Alert on the transition, then
at most daily.

**Set an explicit maximum duration on any job that makes network calls in a loop**, plus a
deadline that stops cleanly and reports what is left. The platform default is short enough
to kill a run before it can report.

**A monitor that pings a sleeping database keeps it awake.** On usage-billed hosting that
turns monitoring into an overspend and then a suspension. Check the interval against the
sleep timeout.

**Check the function region against the database region before blaming the database.**
Vercel puts serverless functions in Washington unless the project says otherwise. A database
in Frankfurt then means every query crosses the Atlantic — slow, and dropping often enough
to kill a job every few hours. Every symptom looks like an unreliable database. The response
header `x-vercel-id` names the region the function actually ran in. Fixing it took one line
and cut a trivial query from 1895 ms to 304 ms.

## Email

**A cron that mails the first page and returns a cursor nobody calls back with** silently
never reaches recipient 201, while the logs read success.

**Provider send limits are per hour and reputation-based, not fixed.** Find the real number,
write it down, and set the migration trigger below it.

**Bulk email failures are silent** unless something reads the bounce mailbox. Nothing does.

**Placement in a mail client's tabs is per-recipient and learned.** It can be influenced,
never guaranteed, and your own inbox stops being a valid test after a few sends.

## Deployment

**Anything that touches disk in a request handler passes locally and fails in production.**
The static directory is not on the serverless filesystem; a runtime file read is invisible
to the build tracer.

**Some image formats the renderer cannot decode** will kill a whole response with an
unrelated-looking error.

## Accounts and platforms

**The country on a payments profile cannot be changed.** It is fixed at signup, from where
you happened to be sitting. Getting it wrong means closing the account and starting again.

**Verify site ownership with a text file, not an ad script.** The script can start serving
before the paying-customer gating exists.

**Restricted-content policies are shorter than the fear of them.** Read the actual list
before assuming a category is banned.
