export const CAMPAIGN_FORM_FIELDS = ["name", "phone", "email"] as const;

export const FUNNELFAST_PIXEL_EVENTS = {
  pageView: "PageView",
  viewContent: "ViewContent",
  lead: "Lead",
  contact: "Contact",
  formOpened: "FunnelFastRegistrationOpened",
  whatsappHandoff: "CampaignWhatsAppHandoff",
} as const;

export type CampaignRegistration = Record<(typeof CAMPAIGN_FORM_FIELDS)[number], string>;

export function getCampaignRegistrationErrors(data: CampaignRegistration) {
  const normalizedPhone = data.phone.replace(/\s|-/g, "");

  return {
    name: !data.name.trim()
      ? "اكتب اسمك علشان نعرف نكلمك"
      : data.name.trim().length < 2
        ? "الاسم لازم يكون حرفين على الأقل"
        : "",
    phone: !normalizedPhone
      ? "اكتب رقم واتساب علشان نقدر نكمل معاك"
      : !/^(\+?20|0)?1[0-9]{9}$/.test(normalizedPhone)
        ? "رقم الواتساب مش صح — اكتبه بصيغة 01xxxxxxxxx"
        : "",
    email: !data.email.trim()
      ? "اكتب الإيميل بتاعك"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
        ? "الإيميل مش صح — تأكد من الصيغة"
        : "",
  };
}

export function isCampaignRegistrationValid(data: CampaignRegistration) {
  return Object.values(getCampaignRegistrationErrors(data)).every((error) => !error);
}
