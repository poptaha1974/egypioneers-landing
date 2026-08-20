import { describe, expect, it, vi } from "vitest";
import { paymentWebhookNotConfigured } from "./paymentWebhook";

describe("paymentWebhookNotConfigured", () => {
  it("يرفض Purchase بأمان قبل تفعيل بوابة دفع موثقة", () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    paymentWebhookNotConfigured({} as never, { status } as never);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
      path: "/api/webhooks/payment",
    }));
  });
});
