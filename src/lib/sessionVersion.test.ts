import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient, fakeTable, type FakeTable } from "@/lib/testing/fakePrisma";

const db = vi.hoisted(() => ({ current: null as unknown as Record<string, unknown> }));
vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return db.current;
  },
}));

import { isSessionRevoked, onGoogleLinked } from "@/lib/sessionVersion";

let users: FakeTable;

beforeEach(() => {
  users = fakeTable([
    { id: "with-password", password: "stranger-hash", sessionVersion: 0 },
    { id: "google-only", password: null, sessionVersion: 0 },
  ]);
  db.current = fakeClient({ user: users });
});

const row = (id: string) => users.rows.find((u) => u.id === id)!;

describe("isSessionRevoked", () => {
  it("keeps a session whose version matches the account", () => {
    expect(isSessionRevoked(2, 2)).toBe(false);
  });

  it("ends a session issued before the password changed", () => {
    expect(isSessionRevoked(1, 2)).toBe(true);
  });

  it("treats sessions from before this change as version 0, so the deploy signs no one out", () => {
    expect(isSessionRevoked(undefined, 0)).toBe(false);
    expect(isSessionRevoked(undefined, 1)).toBe(true);
  });
});

describe("onGoogleLinked", () => {
  it("erases a password set before Google was linked, and ends every other session", async () => {
    await onGoogleLinked("with-password");

    expect(row("with-password").password).toBeNull();
    expect(row("with-password").sessionVersion).toBe(1);
  });

  it("leaves a Google-only account untouched", async () => {
    await onGoogleLinked("google-only");

    expect(row("google-only").sessionVersion).toBe(0);
  });
});
