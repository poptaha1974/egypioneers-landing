import { describe, expect, it } from "vitest";
import { appendDraftEvent } from "./draftLeadProjection";

const registrationEvent = {
  event_id: "event_form_001",
  message_origin: "landing_form" as const,
  registration_event_id: "registration_test_utm_dedup_v2_001",
  visitor_session_id: "draft_session_test_utm_dedup_v2_001",
  normalized_phone: "201000000000",
  raw_message: "",
  occurred_at: "2026-08-21T12:00:00.000Z",
};

describe("draft Event Log and Contact Projection", () => {
  it("يبقي Event Log append-only ويُنشئ Contact Projection واحداً للتسجيل", () => {
    const result = appendDraftEvent([], [], registrationEvent);
    expect(result.eventLog).toHaveLength(1);
    expect(result.projections).toHaveLength(1);
    expect(result.projections[0]).toMatchObject({ event_count: 1, prefilled_event_count: 0 });
    expect(result.routing).toMatchObject({ claude_called: false, hot_gate_called: false, capi_called: false });
  });

  it("يعزل whatsapp_prefilled عن Claude وHOT ويحدّث Projection نفسه", () => {
    const first = appendDraftEvent([], [], registrationEvent);
    const prefilled = appendDraftEvent(first.eventLog, first.projections, {
      ...registrationEvent,
      event_id: "event_prefilled_002",
      message_origin: "whatsapp_prefilled",
      raw_message: "أنا TEST سجلت في ويبنار Egy-Pioneers وعايز أعرف تفاصيل الدخول.",
      occurred_at: "2026-08-21T12:00:17.000Z",
    });

    expect(prefilled.eventLog).toHaveLength(2);
    expect(prefilled.projections).toHaveLength(1);
    expect(prefilled.projections[0]).toMatchObject({ event_count: 2, prefilled_event_count: 1 });
    expect(prefilled.routing).toEqual({
      claude_called: false,
      hot_gate_called: false,
      sales_alert_called: false,
      capi_called: false,
      crm_called: false,
      sheet_called: false,
    });
  });

  it("لا يفتح Claude إلا لرسالة WhatsApp عضوية", () => {
    const result = appendDraftEvent([], [], {
      ...registrationEvent,
      event_id: "event_organic_003",
      message_origin: "whatsapp_organic",
      raw_message: "أنا جاهز أبدأ وعايز أعرف التكلفة وموعد المقابلة.",
    });
    expect(result.routing).toMatchObject({ claude_called: true, hot_gate_called: true, capi_called: false });
  });
});
