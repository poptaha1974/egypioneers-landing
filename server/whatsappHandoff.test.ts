import { describe, expect, it } from "vitest";
import { getPostSubmitWhatsAppUrl, WHATSAPP_URL } from "../client/src/lib/leadHandoff";

describe("تسليم العميل إلى واتساب بعد نجاح النموذج", () => {
  it("يعرض رابط محادثة واتساب فقط بعد نجاح النموذج", () => {
    expect(getPostSubmitWhatsAppUrl("success")).toBe(WHATSAPP_URL);
    expect(getPostSubmitWhatsAppUrl("idle")).toBeNull();
    expect(getPostSubmitWhatsAppUrl("submitting")).toBeNull();
    expect(getPostSubmitWhatsAppUrl("error")).toBeNull();
    expect(WHATSAPP_URL).toMatch(/^https:\/\/wa\.me\/15559022738\?text=/);
  });
});
