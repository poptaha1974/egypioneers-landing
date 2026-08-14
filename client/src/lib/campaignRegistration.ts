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

export function normalizeEgyptianWhatsApp(value: string) {
  const compact = value.replace(/[\s-]/g, "");
  if (/^01[0125]\d{8}$/.test(compact)) return `20${compact.slice(1)}`;
  if (/^20?1[0125]\d{8}$/.test(compact)) return compact.startsWith("20") ? compact : `20${compact}`;
  if (/^\+201[0125]\d{8}$/.test(compact)) return compact.slice(1);
  return null;
}

export function isEgyptianWhatsAppFormatValid(value: string) {
  return Boolean(normalizeEgyptianWhatsApp(value));
}

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
      : !isEgyptianWhatsAppFormatValid(normalizedPhone)
        ? "رقم الواتساب غير صحيح — استخدم رقم مصري يبدأ بـ 010 أو 011 أو 012 أو 015"
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
