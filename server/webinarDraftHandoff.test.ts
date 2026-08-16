import { describe, expect, it } from "vitest";
import {
  createQueuedWebinarDraftHandoff,
  WEBINAR_N8N_DRAFT_WEBHOOK_PATH,
} from "./webinarDraftHandoff";

const input = {
  leadId: 42,
  messageType: "welcome" as const,
  webinarStartAt: new Date("2026-08-19T15:00:00.000Z"),
};

describe("عقد تسليم مسودة n8n للويبنار", () => {
  it("يجهز حمولة queued آمنة فقط لمسار مسودة الويبنار", () => {
    expect(createQueuedWebinarDraftHandoff(input, {
      status: "queued",
      messageLogId: 77,
      leadName: "إيهاب",
      leadPhone: "+201005106459",
    })).toEqual({
      webhookPath: WEBINAR_N8N_DRAFT_WEBHOOK_PATH,
      payload: {
        leadId: 42,
        messageLogId: 77,
        name: "إيهاب",
        phone: "+201005106459",
        messageType: "welcome",
        webinarStartAt: "2026-08-19T15:00:00.000Z",
        whatsappConsent: true,
        draftStatus: "queued_for_review_no_send",
        requiresServerLogCheck: true,
      },
    });
  });

  it("لا ينشئ حمولة لمسودة n8n عند أي قرار skipped", () => {
    expect(createQueuedWebinarDraftHandoff(input, {
      status: "skipped",
      reason: "missing_consent",
    })).toBeNull();
  });
});
