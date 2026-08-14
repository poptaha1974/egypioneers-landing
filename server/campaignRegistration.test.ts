import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_FORM_FIELDS,
  FUNNELFAST_PIXEL_EVENTS,
  getCampaignRegistrationErrors,
  isCampaignRegistrationValid,
} from "../client/src/lib/campaignRegistration";

describe("نموذج التسجيل المختصر للحملة", () => {
  it("يعتمد حقول FunnelFast الثلاثة فقط", () => {
    expect(CAMPAIGN_FORM_FIELDS).toEqual(["name", "phone", "email"]);
  });

  it("يتحقق من الاسم وواتساب والإيميل قبل التسجيل", () => {
    expect(isCampaignRegistrationValid({ name: "إيهاب طه", phone: "01037303001", email: "ehab@example.com" })).toBe(true);
    expect(getCampaignRegistrationErrors({ name: "", phone: "010", email: "not-an-email" })).toEqual({
      name: "اكتب اسمك علشان نعرف نكلمك",
      phone: "رقم الواتساب مش صح — اكتبه بصيغة 01xxxxxxxxx",
      email: "الإيميل مش صح — تأكد من الصيغة",
    });
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
