import type { VerifiedPurchasePayload } from "./purchaseContract";

type FetchLike = (input: string, init: RequestInit) => Promise<{ ok: boolean; status: number }>;

/** يسلّم Purchase مؤكداً إلى Workflow CAPI منفصل عن مسار الـLead. */
export async function deliverVerifiedPurchaseToCapi(
  purchase: VerifiedPurchasePayload,
  request: FetchLike = fetch,
): Promise<boolean> {
  const webhookUrl = process.env.PURCHASE_CAPI_WEBHOOK_URL?.trim();
  if (!webhookUrl) return false;

  try {
    const response = await request(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(purchase),
    });
    return response.ok;
  } catch (error) {
    console.warn("[Purchase CAPI] Webhook delivery error", error);
    return false;
  }
}
