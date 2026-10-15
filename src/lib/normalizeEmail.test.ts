import { describe, expect, it } from "vitest";
import { normalizeEmail } from "@/lib/normalizeEmail";

describe("normalizeEmail", () => {
  it("lowercases and trims, so 'Anna@Gmail.com ' and 'anna@gmail.com' are one account", () => {
    expect(normalizeEmail("  Anna@Gmail.COM ")).toBe("anna@gmail.com");
  });

  it("leaves an already-normal address unchanged", () => {
    expect(normalizeEmail("anna@gmail.com")).toBe("anna@gmail.com");
  });
});
