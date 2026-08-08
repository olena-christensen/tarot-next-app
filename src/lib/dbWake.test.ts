import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withDbWake } from "./dbWake";

// The retry is invisible when it works, so these are the only evidence it does
// the narrow thing it is supposed to: swallow a sleeping compute, and nothing
// else. A retry that quietly re-ran real failures would hide bugs instead of
// outages.

describe("withDbWake", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the result without retrying when the first call works", async () => {
    const work = vi.fn().mockResolvedValue("rows");
    await expect(withDbWake("test", work)).resolves.toBe("rows");
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("retries when the database is unreachable, and succeeds", async () => {
    const unreachable = Object.assign(
      new Error("Can't reach database server at ep-x.eu-central-1.aws.neon.tech"),
      { code: "P1001" }
    );
    const work = vi.fn().mockRejectedValueOnce(unreachable).mockResolvedValue("rows");

    const promise = withDbWake("test", work);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(promise).resolves.toBe("rows");
    expect(work).toHaveBeenCalledTimes(2);
  });

  it("survives a wake slower than the first retry", async () => {
    // The 2026-08-08 failure: one retry after 3s was not enough, both attempts
    // died inside the same slow start. The second gap has to outlast it.
    const unreachable = Object.assign(new Error("Can't reach database server"), {
      code: "P1001",
    });
    const work = vi
      .fn()
      .mockRejectedValueOnce(unreachable)
      .mockRejectedValueOnce(unreachable)
      .mockResolvedValue("rows");

    const promise = withDbWake("test", work);
    await vi.advanceTimersByTimeAsync(11000);

    await expect(promise).resolves.toBe("rows");
    expect(work).toHaveBeenCalledTimes(3);
  });

  it("does NOT retry a real query error", async () => {
    // A constraint violation is a bug. Retrying it wastes three seconds and
    // then reports the same failure, later.
    const violation = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    });
    const work = vi.fn().mockRejectedValue(violation);

    await expect(withDbWake("test", work)).rejects.toThrow(
      "Unique constraint failed"
    );
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("gives up after three attempts so a real outage still alerts", async () => {
    const unreachable = Object.assign(new Error("Can't reach database server"), {
      code: "P1001",
    });
    const work = vi.fn().mockRejectedValue(unreachable);

    const promise = withDbWake("test", work);
    const assertion = expect(promise).rejects.toThrow(
      "Can't reach database server"
    );
    await vi.advanceTimersByTimeAsync(11000);
    await assertion;

    expect(work).toHaveBeenCalledTimes(3);
  });

  it("recognises an initialization error with no code", async () => {
    const init = Object.assign(new Error("something opaque"), {
      name: "PrismaClientInitializationError",
    });
    const work = vi.fn().mockRejectedValueOnce(init).mockResolvedValue("rows");

    const promise = withDbWake("test", work);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(promise).resolves.toBe("rows");
    expect(work).toHaveBeenCalledTimes(2);
  });
});
