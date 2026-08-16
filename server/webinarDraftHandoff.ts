import type {
  QueueWebinarMessageInput,
  QueueWebinarMessageResult,
} from "./webinarMessageQueue";

/**
 * اسم مسار Webhook في مسودة n8n فقط. لا تستدعي هذه الوحدة الشبكة ولا تنشر الـWorkflow.
 */
export const WEBINAR_N8N_DRAFT_WEBHOOK_PATH = "egy-pioneers-webinar-welcome";
export const WEBINAR_N8N_DRAFT_WEBHOOK_URL =
  "https://allhomz.app.n8n.cloud/webhook/egy-pioneers-webinar-welcome";
export const WEBINAR_N8N_DRAFT_HANDOFF_TIMEOUT_MS = 5_000;

export type QueuedWebinarDraftHandoff = {
  webhookPath: typeof WEBINAR_N8N_DRAFT_WEBHOOK_PATH;
  payload: {
    leadId: number;
    messageLogId: number;
    name: string;
    phone: string;
    messageType: QueueWebinarMessageInput["messageType"];
    webinarStartAt: string;
    whatsappConsent: true;
    draftStatus: "queued_for_review_no_send";
    requiresServerLogCheck: true;
  };
};

/**
 * يحول قرار الاصطفاف المقبول إلى الحمولة التي تفهمها مسودة n8n.
 * قرارات skipped لا تحصل على حمولة ولا يمكن أن تصل إلى أي Webhook.
 */
export function createQueuedWebinarDraftHandoff(
  input: QueueWebinarMessageInput,
  result: QueueWebinarMessageResult,
): QueuedWebinarDraftHandoff | null {
  if (result.status !== "queued") return null;

  return {
    webhookPath: WEBINAR_N8N_DRAFT_WEBHOOK_PATH,
    payload: {
      leadId: input.leadId,
      messageLogId: result.messageLogId,
      name: result.leadName,
      phone: result.leadPhone,
      messageType: input.messageType,
      webinarStartAt: input.webinarStartAt.toISOString(),
      whatsappConsent: true,
      draftStatus: "queued_for_review_no_send",
      requiresServerLogCheck: true,
    },
  };
}

type DraftWebhookReceipt = {
  queued?: boolean;
  messageType?: string;
  delivery?: string;
};

type FetchLike = (input: string, init: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
}>;

export type WebinarDraftDeliveryResult =
  | { attempted: false; delivered: false; reason: "not_queued" }
  | { attempted: true; delivered: false; status?: number }
  | { attempted: true; delivered: true; status: number; draftAccepted: boolean };

export type WebinarDraftLogStatusAction = "draft_received" | "unchanged";

function isDraftWebhookReceipt(value: unknown): value is DraftWebhookReceipt {
  return typeof value === "object" && value !== null;
}

async function readDraftWebhookReceipt(response: Awaited<ReturnType<FetchLike>>): Promise<DraftWebhookReceipt | null> {
  if (!response.json) return null;
  try {
    const value = await response.json();
    return isDraftWebhookReceipt(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * لا يتحول السجل إلى draft_received إلا بعد قبول صريح من مسودة n8n.
 * هذا لا يعبر عن إرسال أو تسليم واتساب.
 */
export function getWebinarDraftLogStatusAction(
  queueDecision: QueueWebinarMessageResult,
  delivery: WebinarDraftDeliveryResult,
): WebinarDraftLogStatusAction {
  if (queueDecision.status !== "queued") return "unchanged";
  if (!delivery.delivered || !delivery.draftAccepted) return "unchanged";
  return "draft_received";
}

/**
 * ينفذ POST لمسودة n8n فقط عند وجود حمولة queued.
 * لا يتصل بأي مزود واتساب، ولا ينشر المسودة، وفشله لا يغير قرار الاصطفاف المحفوظ.
 */
export async function deliverQueuedWebinarDraft(
  handoff: QueuedWebinarDraftHandoff | null,
  request: FetchLike = fetch,
): Promise<WebinarDraftDeliveryResult> {
  if (!handoff) return { attempted: false, delivered: false, reason: "not_queued" };

  try {
    const response = await request(WEBINAR_N8N_DRAFT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handoff.payload),
      signal: AbortSignal.timeout(WEBINAR_N8N_DRAFT_HANDOFF_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn("[Webinar draft handoff] Webhook delivery failed", { status: response.status });
      return { attempted: true, delivered: false, status: response.status };
    }

    const receipt = await readDraftWebhookReceipt(response);
    const draftAccepted = receipt?.queued === true && receipt.delivery === "not_configured";
    return { attempted: true, delivered: true, status: response.status, draftAccepted };
  } catch (error) {
    console.warn("[Webinar draft handoff] Webhook delivery error", error);
    return { attempted: true, delivered: false };
  }
}
