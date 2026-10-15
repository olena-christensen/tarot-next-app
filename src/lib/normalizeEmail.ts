// The one form an email address is stored and looked up in: trimmed and
// lowercased. Registration used to store the address as typed while sign-in
// looked it up lowercased, so "Anna@Gmail.com" could register but never sign in
// (code review 2026-10-15, item 7). Every write of User.email and every lookup by
// it goes through this. Existing rows were brought into line by the migration
// `20261015120000_lowercase_user_emails`.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
