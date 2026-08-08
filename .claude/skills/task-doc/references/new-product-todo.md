# Starting list for a new product

Copy this in. Delete what does not apply. Every line is one item, verb first, per the shape
rule. None of these are interesting; all of them are discovered late and cost a week.

## Blocking — before taking a single real payment

- [ ] 📋 Register the legal entity and decide the trade name shown to customers.
- [ ] 📋 Fix one legal-name standard and use it in every document without variation.
- [ ] 📋 Open the acquiring account and confirm which currency it settles in.
- [ ] 📋 Confirm the currency code the payment provider needs for tax receipts.
- [ ] 📋 Register the fiscal receipt device and connect it to the payment terminal.
- [ ] 💻 Publish terms, privacy, cookie and refund pages, and link all four in the footer.
- [ ] 📋 Read the terms end to end for clauses that contradict each other.
- [ ] 💻 Verify a real payment end to end on production, not on a test key.
- [ ] 💻 Confirm a tax receipt is actually issued for that payment.

## Blocking — before letting a stranger sign up

- [ ] 💻 Rate-limit sign-in and registration on both the account and the address.
- [ ] 💻 Add error boundaries so a crash shows a page, not a blank screen.
- [ ] 💻 Send yourself an alert when any scheduled job fails.
- [ ] 💻 Wrap every scheduled job so a crash still sends that alert.
- [ ] 💻 Add a health endpoint that runs a real database query.
- [ ] 📋 Point an external uptime monitor at the health endpoint, not the home page.
- [ ] 💻 Record a heartbeat per job and alert when one goes quiet.
- [ ] 💻 Let a user export their data and delete their account.
- [ ] 💻 Page through every batch job instead of processing the first page only.

## Must-have once triggered

- [ ] 📋 Register for cross-border sales tax when the first foreign consumer pays.
- [ ] 💻 Move bulk email to a bulk sender before the list reaches the provider's limit.
- [ ] 💻 Hide ads from paying customers the day ads go live.
- [ ] 💻 Make the consent banner block tracking, not mention it, the day ads go live.

## Growth — the day it ships

- [ ] 📣 Publish pages a search engine can actually read, outside the login.
- [ ] 📣 Decide the one channel you will actually work, and ignore the rest.
- [ ] 📣 Put a share link on anything a user might want to show someone.
- [ ] 📣 Measure how many people arrive, sign up, and pay — three numbers, not a dashboard.

## Nice to have

- [ ] 📋 Pay a lawyer to read the terms and privacy pages.
- [ ] 🎨 Fix the interface papercuts you have been stepping over.
- [ ] 💻 Wire the sign-in providers whose tables already exist.
