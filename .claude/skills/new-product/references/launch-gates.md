# Gates

Each must be true before the next phase starts. A gate is not a checklist to feel good
about — it is a thing that was skipped once and had to be paid for later.

## Before taking a single real payment

- [ ] 💻 Complete one real purchase on production with a real card.
- [ ] 📋 Confirm a tax receipt was issued and registered for that purchase.
- [ ] 💻 Confirm the tier is granted only after the signed callback, never before.
- [ ] 💻 Confirm a duplicate callback grants nothing twice.
- [ ] 💻 Confirm a payment whose callback never arrives is recovered by polling.
- [ ] 💻 Confirm an abandoned checkout reaches a terminal state.
- [ ] 📋 Read every price claim on the page against the code.
- [ ] 📋 Confirm the legal name is identical in the entity, receipts and legal pages.

## Before letting a stranger sign up

- [ ] 💻 Rate-limit sign-in and registration on both the account and the address.
- [ ] 💻 Show a real page when the app throws, not a blank screen.
- [ ] 💻 Let a user export their data and delete their account.
- [ ] 💻 Confirm deleting an account actually evicts the session.
- [ ] 💻 Confirm password reset mail sends through the shared mailer, not its own transport.

## Before trusting any scheduled job

- [ ] 💻 Break the job on purpose and confirm the alert email arrives.
- [ ] 💻 Confirm a crash alerts, not only a counted failure inside the loop.
- [ ] 💻 Set an explicit maximum duration and a deadline that stops cleanly.
- [ ] 💻 Confirm the job pages through all work instead of the first batch.
- [ ] 💻 Add a health endpoint that runs a real database query.
- [ ] 📋 Point an external monitor at that endpoint, at an interval the database can afford.

## Before announcing it to anyone

- [ ] 📣 Publish pages a search engine can read without an account.
- [ ] 💻 Confirm the site renders at 360 pixels wide.
- [ ] 📋 Confirm every advertised feature exists or is marked coming soon.
- [ ] 📣 Decide the three numbers you will watch: arrivals, sign-ups, payments.
- [ ] 📋 Send one message to one real stranger and watch what they do.

## Before adding advertising

- [ ] 📋 Read the network's prohibited and restricted lists before assuming eligibility.
- [ ] 💻 Verify site ownership with a text file, not an ad script.
- [ ] 💻 Hide ads from paying customers before the first ad renders.
- [ ] 💻 Make the consent banner block tracking rather than mention it.
