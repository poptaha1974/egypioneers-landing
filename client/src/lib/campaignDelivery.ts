/**
 * مسار تسليم تسجيل الويبنار المعتمد لأكاديمية Egy-Pioneers.
 * لا يضم أي أصل AllHomz أو Pixel؛ دوره إرسال بيانات التسجيل إلى Workflow الأكاديمية فقط.
 */
export const ACADEMY_LEAD_WEBHOOK_URL = "https://allhomz.app.n8n.cloud/webhook/egy-pioneers-lead";
export const ACADEMY_CAMPAIGN_WHATSAPP_PHONE = "201025073479";

export type MetaLeadAttribution = {
  eventId: string;
  eventSourceUrl?: string;
  fbclid?: string;
  fbp?: string;
};

/**
 * يلتقط معرّفات Meta من جلسة المتصفح مرة واحدة لكل تسجيل.
 * eventId يُرسل للمتصفح وn8n معاً حتى تقوم Meta بإلغاء تكرار حدث Lead.
 */
export function captureMetaLeadAttribution(): MetaLeadAttribution {
  const eventId = `lead_${Date.now()}_${crypto.randomUUID().replace(/-/g, "")}`;

  if (typeof window === "undefined" || typeof document === "undefined") {
    return { eventId };
  }

  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid") || undefined;
  const fbp = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1] || undefined;

  return { eventId, eventSourceUrl: window.location.href, fbclid, fbp };
}
