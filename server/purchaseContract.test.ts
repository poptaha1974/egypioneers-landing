import { describe, expect, it } from "vitest";
import { PURCHASE_WEBHOOK_PATH } from "./purchaseContract";

describe("Purchase contract", () => {
  it("يحجز مسار دفع مستقل عن صفحة التسجيل وحدث Lead", () => {
    expect(PURCHASE_WEBHOOK_PATH).toBe("/api/webhooks/payment");
  });
});
