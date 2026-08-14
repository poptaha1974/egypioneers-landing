import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_FORM_FIELDS,
  FUNNELFAST_PIXEL_EVENTS,
  getCampaignRegistrationErrors,
  isCampaignRegistrationValid,
  isEgyptianWhatsAppFormatValid,
  normalizeEgyptianWhatsApp,
} from "../client/src/lib/campaignRegistration";

describe("نموذج التسجيل المختصر للحملة", () => {
  it("يعتمد حقول FunnelFast الثلاثة فقط", () => {
    expect(CAMPAIGN_FORM_FIELDS).toEqual(["name", "phone", "email"]);
  });

  it("يتحقق من الاسم وواتساب والإيميل قبل التسجيل", () => {
    expect(isCampaignRegistrationValid({ name: "إيهاب طه", phone: "01037303001", email: "ehab@example.com" })).toBe(true);
    expect(getCampaignRegistrationErrors({ name: "", phone: "010", email: "not-an-email" })).toEqual({
      name: "اكتب اسمك علشان نعرف نكلمك",
      phone: "رقم الواتساب غير صحيح — استخدم رقم مصري يبدأ بـ 010 أو 011 أو 012 أو 015",
      email: "الإيميل مش صح — تأكد من الصيغة",
    });
  });

  it("يتحقق فورياً من صيغة أرقام واتساب المصرية المعتمدة", () => {
    expect(isEgyptianWhatsAppFormatValid("01037303001")).toBe(true);
    expect(isEgyptianWhatsAppFormatValid("+20 10 3730 3001")).toBe(true);
    expect(normalizeEgyptianWhatsApp("01512345678")).toBe("201512345678");
    expect(isEgyptianWhatsAppFormatValid("01312345678")).toBe(false);
  });

  it("يحافظ على أحداث FunnelFast القياسية للحملة", () => {
    expect(FUNNELFAST_PIXEL_EVENTS).toMatchObject({
      pageView: "PageView",
      viewContent: "ViewContent",
      lead: "Lead",
      contact: "Contact",
    });
  });
});
