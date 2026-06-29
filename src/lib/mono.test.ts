import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { chargeByToken } from "./mono";

describe("chargeByToken", () => {
  beforeEach(() => {
    process.env.MONO_ACQUIRING_TOKEN = "test-token";
    process.env.NEXT_PUBLIC_APP_URL = "https://theveil.app";
  });
  afterEach(() => vi.restoreAllMocks());

  it("POSTs a merchant-initiated token charge and returns the parsed body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ invoiceId: "inv_1", status: "created" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await chargeByToken({
      cardToken: "tok_abc",
      amount: 500,
      reference: "user1:MONTHLY:renewal:123",
      destination: "The Veil — MONTHLY renewal",
    });

    expect(result).toEqual({ invoiceId: "inv_1", status: "created" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.monobank.ua/api/merchant/wallet/payment");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Token"]).toBe("test-token");

    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      cardToken: "tok_abc",
      amount: 500,
      ccy: 978,
      initiationKind: "merchant",
      merchantPaymInfo: {
        reference: "user1:MONTHLY:renewal:123",
        destination: "The Veil — MONTHLY renewal",
      },
      webHookUrl: "https://theveil.app/api/payments/webhook",
    });
  });
});
