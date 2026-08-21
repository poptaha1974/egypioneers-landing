export type DraftMessageOrigin = "landing_form" | "whatsapp_prefilled" | "whatsapp_organic";

export type DraftEventLogEntry = {
  event_id: string;
  message_origin: DraftMessageOrigin;
  registration_event_id: string;
  visitor_session_id: string;
  normalized_phone: string;
  raw_message: string;
  occurred_at: string;
};

export type DraftContactProjection = {
  projection_key: string;
  registration_event_id: string;
  visitor_session_id: string;
  normalized_phone: string;
  last_interaction_at: string;
  event_count: number;
  model_classification: null;
  final_status: null;
  prefilled_event_count: number;
};

export type DraftRouting = {
  claude_called: boolean;
  hot_gate_called: boolean;
  sales_alert_called: boolean;
  capi_called: boolean;
  crm_called: boolean;
  sheet_called: boolean;
};

export function draftProjectionKey(event: Pick<DraftEventLogEntry, "registration_event_id" | "visitor_session_id" | "normalized_phone">) {
  return event.registration_event_id
    ? `registration:${event.registration_event_id}:${event.normalized_phone}`
    : `session:${event.visitor_session_id}:${event.normalized_phone}`;
}

export function getDraftRouting(origin: DraftMessageOrigin): DraftRouting {
  const organic = origin === "whatsapp_organic";
  return {
    claude_called: organic,
    hot_gate_called: organic,
    sales_alert_called: false,
    capi_called: false,
    crm_called: false,
    sheet_called: false,
  };
}

export function appendDraftEvent(
  events: DraftEventLogEntry[],
  projections: DraftContactProjection[],
  event: DraftEventLogEntry,
) {
  const key = draftProjectionKey(event);
  const existing = projections.find((projection) => projection.projection_key === key);
  const eventLog = [...events, event];
  const projection: DraftContactProjection = existing
    ? {
        ...existing,
        last_interaction_at: event.occurred_at,
        event_count: existing.event_count + 1,
        prefilled_event_count: existing.prefilled_event_count + (event.message_origin === "whatsapp_prefilled" ? 1 : 0),
      }
    : {
        projection_key: key,
        registration_event_id: event.registration_event_id,
        visitor_session_id: event.visitor_session_id,
        normalized_phone: event.normalized_phone,
        last_interaction_at: event.occurred_at,
        event_count: 1,
        model_classification: null,
        final_status: null,
        prefilled_event_count: event.message_origin === "whatsapp_prefilled" ? 1 : 0,
      };

  return {
    eventLog,
    projections: existing
      ? projections.map((item) => (item.projection_key === key ? projection : item))
      : [...projections, projection],
    routing: getDraftRouting(event.message_origin),
  };
}
