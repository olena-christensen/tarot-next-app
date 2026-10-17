import { describe, expect, it } from "vitest";
import { halloweenBootScript, halloweenPhase, msUntilHalloween, splitCountdown } from "./halloween";

describe("halloweenPhase", () => {
  it("counts down through October until the 31st", () => {
    expect(halloweenPhase(new Date(2026, 9, 1, 0, 0))).toBe("countdown");
    expect(halloweenPhase(new Date(2026, 9, 30, 23, 59, 59))).toBe("countdown");
  });

  it("is Halloween night for the whole of 31 October", () => {
    expect(halloweenPhase(new Date(2026, 9, 31, 0, 0))).toBe("night");
    expect(halloweenPhase(new Date(2026, 9, 31, 23, 59, 59))).toBe("night");
  });

  it("shows nothing outside October", () => {
    expect(halloweenPhase(new Date(2026, 8, 30, 23, 59))).toBeNull();
    expect(halloweenPhase(new Date(2026, 10, 1, 0, 0))).toBeNull();
  });
});

describe("msUntilHalloween", () => {
  it("measures to midnight at the start of 31 October", () => {
    expect(msUntilHalloween(new Date(2026, 9, 30, 0, 0))).toBe(24 * 3600 * 1000);
  });

  it("never goes below zero", () => {
    expect(msUntilHalloween(new Date(2026, 9, 31, 12, 0))).toBe(0);
  });
});

describe("splitCountdown", () => {
  it("splits into days, hours, minutes and seconds", () => {
    const ms = ((13 * 24 + 6) * 3600 + 14 * 60 + 22) * 1000 + 999;
    expect(splitCountdown(ms)).toEqual({ days: 13, hours: 6, minutes: 14, seconds: 22 });
  });
});

describe("halloweenBootScript", () => {
  it("is a self-contained script that sets the attribute", () => {
    const script = halloweenBootScript();
    expect(script).toContain("data-halloween");
    expect(() => new Function(script)).not.toThrow();
  });
});
