import { describe, it, expect } from "vitest";
import enMessages from "../../messages/en/greetings.json";
import {
  GREETING_KEYS,
  NAME_FREE_KEYS,
  resolveGreeting,
  pickKey,
  type GreetingContext,
} from "./greetings";

const en = enMessages.greetings as Record<string, string>;

// Minimal next-intl-style translate over the EN greetings namespace.
const t = (key: string, values?: Record<string, string>): string => {
  const template = en[key];
  if (template === undefined) throw new Error(`missing key: ${key}`);
  return values
    ? template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "")
    : template;
};

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  key(i: number) {
    return Array.from(this.map.keys())[i] ?? null;
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
}

const makeCtx = (over: Partial<GreetingContext> = {}): GreetingContext => ({
  name: "Olena",
  t,
  sessionStore: new MemoryStorage(),
  persistentStore: new MemoryStorage(),
  random: () => 0,
  ...over,
});

describe("resolveGreeting", () => {
  it("returns a stable greeting across repeated calls in one session", () => {
    const ctx = makeCtx({ random: () => 0.42 });
    const first = resolveGreeting(ctx);
    for (let i = 0; i < 20; i++) expect(resolveGreeting(ctx)).toBe(first);
  });

  it("falls back to a name-free greeting for missing/blank names", () => {
    const nameFree = new Set(NAME_FREE_KEYS.map((k) => en[k]));
    for (const name of [undefined, null, "", "   "]) {
      const out = resolveGreeting(
        makeCtx({ name: name as string | null | undefined }),
      );
      expect(out).not.toContain("{name}");
      expect(out).not.toMatch(/,\s*\./); // no dangling ", ."
      expect(nameFree.has(out)).toBe(true);
    }
  });

  it("substitutes the name into every greeting in the pool", () => {
    for (const key of GREETING_KEYS) {
      const out = t(key, { name: "Olena" });
      expect(out).not.toContain("{name}");
      expect(out).toContain("Olena");
    }
  });

  it("avoids repeating the previous session's greeting when possible", () => {
    const persistentStore = new MemoryStorage();
    const first = resolveGreeting(makeCtx({ persistentStore, random: () => 0 }));
    const second = resolveGreeting(
      makeCtx({ persistentStore, random: () => 0 }),
    );
    expect(second).not.toBe(first);
  });

  it("keeps EN copy defined for every key in both pools", () => {
    for (const k of [...GREETING_KEYS, ...NAME_FREE_KEYS])
      expect(en[k]).toBeTruthy();
  });
});

describe("pickKey", () => {
  it("avoids the previous key when the pool allows", () => {
    expect(pickKey(["a", "b", "c"], "a", () => 0)).not.toBe("a");
  });
  it("returns a key even when avoidance would empty the pool", () => {
    expect(pickKey(["only"], "only", () => 0)).toBe("only");
  });
});
