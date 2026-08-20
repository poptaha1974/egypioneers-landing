import type { Request, Response } from "express";
import { getPaymentGatewayReadiness, PURCHASE_WEBHOOK_PATH } from "./purchaseContract";

/**
 * نقطة الاستقبال محجوزة ولا تقبل أي عملية دفع قبل اختيار بوابة رسمياً.
 * التحقق من التوقيع يظل خاصاً بمزود الدفع (Stripe/Paymob/PayTabs...) ولا
 * يُستبدل بمقارنة عامة غير آمنة.
 */
export function paymentWebhookNotConfigured(req: Request, res: Response) {
  const readiness = getPaymentGatewayReadiness();
  return res.status(503).json({
    ok: false,
    code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
    path: PURCHASE_WEBHOOK_PATH,
    missing: readiness.missing,
    message: "Purchase event is deliberately disabled until a verified payment gateway adapter is configured.",
  });
}
