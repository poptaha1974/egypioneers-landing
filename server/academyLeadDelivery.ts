import { ACADEMY_LEAD_WEBHOOK_URL } from "../client/src/lib/campaignDelivery";
import type { EngagementSummary } from "./engagementSummary";

export type AcademyLeadDeliveryPayload = {
  name: string;
  phone: string;
  email: string;
  event_id?: string;
  event_source_url?: string;
  fbclid?: string;
  fbp?: string;
  visitor_session_id?: string;
  engagement_summary?: EngagementSummary;
};

type FetchLike = (input: string, init: RequestInit) => Promise<{ ok: boolean; status: number }>;

/**
 * يسلم التسجيل للـWorkflow الخاص بالأكاديمية بعد حفظه محلياً.
 * لا يفشل تسجيل العميل عند تعذر الأتمتة؛ بل يعيد الحالة ليظهر مسار المتابعة البديل.
 */
export async function deliverAcademyLead(
  payload: AcademyLeadDeliveryPayload,
  request: FetchLike = fetch,
): Promise<boolean> {
  try {
    const response = await request(ACADEMY_LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn("[Academy lead delivery] Webhook delivery failed", { status: response.status });
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Academy lead delivery] Webhook delivery error", error);
    return false;
  }
}
