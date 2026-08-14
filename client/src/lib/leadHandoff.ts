export type LeadSubmissionState = "idle" | "submitting" | "success" | "error";

export const WHATSAPP_URL = "https://wa.me/15559022738?text=%D8%A3%D9%86%D8%A7%20%D8%B3%D8%AC%D9%84%D8%AA%20%D9%81%D9%8A%20%D9%86%D9%85%D9%88%D8%B0%D8%AC%20Egy-Pioneers%20%D9%88%D8%B9%D8%A7%D9%8A%D8%B2%20%D8%A3%D8%B9%D8%B1%D9%81%20%D8%A3%D9%86%D8%B3%D8%A8%20%D8%A8%D8%AF%D8%A7%D9%8A%D8%A9%20%D9%84%D9%8A%D8%A7";

export function getPostSubmitWhatsAppUrl(state: LeadSubmissionState) {
  return state === "success" ? WHATSAPP_URL : null;
}
