import type {
  QueueWebinarMessageInput,
  QueueWebinarMessageResult,
} from "./webinarMessageQueue";

/**
 * اسم مسار Webhook في مسودة n8n فقط. لا تستدعي هذه الوحدة الشبكة ولا تنشر الـWorkflow.
 */
export const WEBINAR_N8N_DRAFT_WEBHOOK_PATH = "egy-pioneers-webinar-welcome";

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
