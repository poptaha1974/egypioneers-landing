import { describe, expect, it } from "vitest";
import { WEBINAR_MESSAGE_TEXT, canQueueWebinarMessage } from "./webinarMessageDraft";

describe("مسودة رسائل الويبنار", () => {
  it("لا تجهز رسالة لمن لم يوافق أو لمن سبق تسجيل نفس الرسالة له", () => {
    expect(canQueueWebinarMessage({ whatsappConsent: 0, alreadyLogged: false })).toBe(false);
    expect(canQueueWebinarMessage({ whatsappConsent: 1, alreadyLogged: true })).toBe(false);
    expect(canQueueWebinarMessage({ whatsappConsent: 1, alreadyLogged: false })).toBe(true);
  });

  it("تحتوي الرسائل الثلاثة على وسيلة إيقاف واضحة بلا وعود نتائج", () => {
    for (const message of Object.values(WEBINAR_MESSAGE_TEXT)) {
      const text = message("إيهاب");
      expect(text).toContain("إلغاء");
      expect(text).not.toContain("لن تندم");
    }
  });
});
