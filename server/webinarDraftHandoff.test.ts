import { describe, expect, it, vi } from "vitest";
import {
  createQueuedWebinarDraftHandoff,
  deliverQueuedWebinarDraft,
  WEBINAR_N8N_DRAFT_WEBHOOK_URL,
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

  it("يسلّم queued فقط إلى Webhook المسودة بلا أي مزود إرسال", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const handoff = createQueuedWebinarDraftHandoff(input, {
      status: "queued",
      messageLogId: 77,
      leadName: "إيهاب",
      leadPhone: "+201005106459",
    });

    await expect(deliverQueuedWebinarDraft(handoff, request)).resolves.toEqual({
      attempted: true,
      delivered: true,
      status: 200,
    });
    expect(request).toHaveBeenCalledWith(WEBINAR_N8N_DRAFT_WEBHOOK_URL, expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }));
  });

  it("لا ينفذ POST عندما يكون القرار skipped", async () => {
    const request = vi.fn();

    await expect(deliverQueuedWebinarDraft(null, request)).resolves.toEqual({
      attempted: false,
      delivered: false,
      reason: "not_queued",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("يعيد فشلاً قابلاً للرصد إذا لم تقبل مسودة Webhook الطلب", async () => {
    const request = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const handoff = createQueuedWebinarDraftHandoff(input, {
      status: "queued",
      messageLogId: 77,
      leadName: "إيهاب",
      leadPhone: "+201005106459",
    });

    await expect(deliverQueuedWebinarDraft(handoff, request)).resolves.toEqual({
      attempted: true,
      delivered: false,
      status: 404,
    });
    expect(warning).toHaveBeenCalledWith(
      "[Webinar draft handoff] Webhook delivery failed",
      { status: 404 },
    );
  });
});
