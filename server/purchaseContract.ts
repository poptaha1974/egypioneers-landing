/**
 * عقد الدفع المعلّق: لا يستقبل النظام حدث Purchase إلا من Webhook بوابة دفع
 * موثوقة بعد التحقق من التوقيع، ولا من صفحة الشكر أو زر الواجهة.
 */
export type VerifiedPurchasePayload = {
  provider: string;
  providerTransactionId: string;
  status: "paid";
  phone: string;
  email?: string;
  amountMinor: number;
  currency: string;
  paidAt: string;
  eventId: string;
  eventSourceUrl?: string;
  fbclid?: string;
  fbp?: string;
};

export const PURCHASE_WEBHOOK_PATH = "/api/webhooks/payment";

/** لا نفعّل التدفق إلا عند إدخال اسم البوابة وسر Webhook عبر إعدادات المشروع. */
export function getPaymentGatewayReadiness() {
  const provider = process.env.PAYMENT_PROVIDER?.trim();
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  const capiWebhookUrl = process.env.PURCHASE_CAPI_WEBHOOK_URL?.trim();
  return {
    ready: Boolean(provider && webhookSecret && capiWebhookUrl),
    provider: provider || null,
    missing: [
      !provider ? "PAYMENT_PROVIDER" : null,
      !webhookSecret ? "PAYMENT_WEBHOOK_SECRET" : null,
      !capiWebhookUrl ? "PURCHASE_CAPI_WEBHOOK_URL" : null,
    ].filter(Boolean),
  };
}
