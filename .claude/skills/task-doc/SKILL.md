---
name: task-doc
description: Rules for writing and maintaining a status or to-do document (STATUS.md, ROADMAP.md, TODO.md, a project task list, or any mirror of one). Use whenever reading, adding to, editing, condensing, reorganising or closing items in such a document, and whenever the user asks a question about something written in one. Also use when starting the task list for a new product. Enforces one line per item so the owner can check compliance at a glance instead of reading prose to find out whether it earned its place.
---

# Task documents

The document has one reader: the person who has to do the work. It is not a place to
record what you know.

## The shape rule

**One line per item. Starts with a verb. If it wraps in the editor, it is wrong.**

That is a mechanical test the owner can apply without reading a word. A wrapped line gets
deleted unread. Do not argue with it, do not make exceptions for important items, do not
sneak a second sentence in.

Also banned inside the live list:

- Sub-bullets under an item.
- A paragraph under an item.
- A preamble above a list, or any sentence explaining what a section is for.
- Dates inside an open item.
- Code blocks.
- Bold runs longer than three words.

## Detail goes somewhere else

The urge to explain is real and the explanation is often correct. It still does not go in
the list. Route it:

- Permanent property of the system → the repository conventions file.
- How a feature works, or an experiment already run → that feature's own document.
- One-off correction of a mistake → nowhere. Delete it.

The item may carry a bare path. It may not carry the reasoning.

## Never write to a future assistant

"Do not reintroduce this", "do not retry that", "verify this is still relevant" are
addressed to an assistant, not to the owner, and cost attention on every read. So is any
note about the document's own history — that a previous version was wrong is not a task.

## Plain language

No abbreviations, acronyms or initialisms — write every term out. No jargon without an
ordinary-words explanation. The owner must not need a search engine to read their own list.

An external limit, threshold or rule is recorded with the real number and where it is
documented. "Check the provider's limits" is not a task; it is a task nobody can start.

## Sections answer one question: when

- **Blocking** — required before the next release. Empty this section rather than leaving
  it holding a note that it is empty.
- **Must-have once triggered** — mandatory the moment a condition is met. The trigger goes
  in the item's own line. Set the threshold below the real limit so there is margin.
- **Growth** — reaching people, keeping them, being paid. Not optional once shipped.
- **Nice to have** — nothing breaks if it never happens.
- **Ideas** — not yet a task.
- **Done** — see below.

Sort by when, never by what kind of work it is. Kind of work is a marker on the item:
💻 code, 🎨 interface, 📋 no-code, 📣 growth. One marker each; an item needing two is two
items.

## Done is a real section, not a bin

Every closed item moves to **Done** as one dated line. Never delete it, never silently drop
it, never let it vanish because it seems obvious now. The owner is entitled to read what
was done — it is the only record that the work happened.

The one line is the whole entry. The detail that made it hard goes to the feature document,
and the Done line may point at that document by path.

## Answer, do not edit

A question about something in the document is a question. Answer it. Do not silently
switch to editing, "fixing" or researching-then-reporting-it-updated — that destroys the
thing being asked about and leaves the owner unable to check the answer.

Say what will change before changing it. Say what changed after. Never delete detail while
condensing without quoting the dropped text back, so the owner can object.

If the document has a mirror, every copy changes in the same turn.

## Starting a new product

Read `references/new-product-todo.md` for the starting list — the items that are true for
every product and are always discovered late.

Read `references/findings.md` for traps already paid for once. Each is a real failure with
a real cost, written so the next product does not repeat it.
