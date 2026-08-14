export type LeadSubmissionState = "idle" | "submitting" | "success" | "error";

export const CAMPAIGN_WHATSAPP_PHONE = "201037303001";
export const WHATSAPP_URL = getCampaignWhatsAppUrl();

export function getCampaignWhatsAppUrl(firstName?: string) {
  const nameIntro = firstName?.trim() ? `أنا ${firstName.trim()} ` : "أنا ";
  const text = `${nameIntro}سجلت في محاضرة Egy-Pioneers المجانية وعايز أكمل الخطوة الجاية.`;

  return `https://wa.me/${CAMPAIGN_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}

export function getPostSubmitWhatsAppUrl(state: LeadSubmissionState) {
  return state === "success" ? WHATSAPP_URL : null;
}
