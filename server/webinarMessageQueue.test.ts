import { describe, expect, it } from "vitest";
import { getWebinarQueueSkipReason } from "./webinarMessageQueue";

describe("بوابة اصطفاف رسائل الويبنار", () => {
  const eligible = {
    leadExists: true,
    whatsappConsent: 1,
    whatsappOptedOutAt: null,
    alreadyLogged: false,
  };

  it("تسمح بالاصطفاف فقط للـLead الموافق وغير الملغي وغير المكرر", () => {
    expect(getWebinarQueueSkipReason(eligible)).toBeNull();
  });

  it("تمنع الاصطفاف عند غياب الموافقة أو وجود إلغاء أو سجل سابق", () => {
    expect(getWebinarQueueSkipReason({ ...eligible, whatsappConsent: 0 })).toBe("missing_consent");
    expect(getWebinarQueueSkipReason({ ...eligible, whatsappOptedOutAt: new Date() })).toBe("opt_out_or_dnd");
    expect(getWebinarQueueSkipReason({ ...eligible, alreadyLogged: true })).toBe("duplicate_prevented");
  });

  it("لا يجهز رسالة لرقم ليس له Lead محفوظ", () => {
    expect(getWebinarQueueSkipReason({ ...eligible, leadExists: false })).toBe("lead_not_found");
  });
});
