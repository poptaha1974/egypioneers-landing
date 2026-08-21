/**
 * Draft-only attribution delivery.
 * This module is intentionally isolated from production delivery and CAPI.
 */
export const DRAFT_ATTRIBUTION_TEST_WEBHOOK_URL =
  "https://allhomz.app.n8n.cloud/webhook-test/egy-pioneers-lead-draft-v2";

const VISITOR_SESSION_STORAGE_KEY = "epa_draft_visitor_session_id_v1";

export type DraftTracking = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  ad_id: null;
  fbclid: string | null;
  fbp: string | null;
  event_source_url: string | null;
  client_user_agent: string | null;
};

export type DraftRegistrationPayload = {
  test_mode: true;
  test_label: "TEST_UTM_DEDUP_V2";
  event_id: string;
  message_origin: "landing_form" | "whatsapp_prefilled" | "whatsapp_organic";
  registration_event_id: string;
  visitor_session_id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  tracking: DraftTracking;
};

function safeId(prefix: string) {
  const uuid = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "")
    : Math.random().toString(36).slice(2);
  return `${prefix}_${uuid}`;
}

export function createDraftRegistrationEventId() {
  return safeId("registration");
}

export function getOrCreateDraftVisitorSessionId(initialId?: string) {
  if (typeof window === "undefined") return safeId("draft_session");

  const existing = window.sessionStorage.getItem(VISITOR_SESSION_STORAGE_KEY);
  if (existing) return existing;

  const created = initialId ?? safeId("draft_session");
  window.sessionStorage.setItem(VISITOR_SESSION_STORAGE_KEY, created);
  return created;
}

export function normalizeDraftEgyptianPhone(raw: string) {
  let phone = String(raw ?? "").replace(/[^0-9+]/g, "");
  if (phone.startsWith("+")) phone = phone.slice(1);
  if (phone.startsWith("0")) return `20${phone.slice(1)}`;
  if (phone.length === 10 && !phone.startsWith("20")) return `20${phone}`;
  return phone;
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  return document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1] ?? null;
}

export function captureDraftTracking(url?: string): DraftTracking {
  if (typeof window === "undefined") {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      utm_id: null,
      ad_id: null,
      fbclid: null,
      fbp: null,
      event_source_url: url ?? null,
      client_user_agent: null,
    };
  }

  const eventSourceUrl = url ?? window.location.href;
  const params = new URL(eventSourceUrl).searchParams;
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    utm_id: params.get("utm_id"),
    // Never infer an ad id from utm_id. A documented Meta mapping is required.
    ad_id: null,
    fbclid: params.get("fbclid"),
    fbp: getCookie("_fbp"),
    event_source_url: eventSourceUrl,
    // Stored for website context only; this module never emits business_messaging CAPI.
    client_user_agent: window.navigator?.userAgent ?? null,
  };
}

export function buildDraftRegistrationPayload(input: {
  name: string;
  phone: string;
  email: string;
  registrationEventId: string;
  visitorSessionId: string;
  eventId?: string;
  messageOrigin?: "landing_form" | "whatsapp_prefilled" | "whatsapp_organic";
  message?: string;
  sourceUrl?: string;
}): DraftRegistrationPayload {
  return {
    test_mode: true,
    test_label: "TEST_UTM_DEDUP_V2",
    event_id: input.eventId ?? `event_${input.registrationEventId}_form`,
    message_origin: input.messageOrigin ?? "landing_form",
    registration_event_id: input.registrationEventId,
    visitor_session_id: input.visitorSessionId,
    name: input.name,
    phone: normalizeDraftEgyptianPhone(input.phone),
    email: input.email,
    message: input.message ?? "",
    tracking: captureDraftTracking(input.sourceUrl),
  };
}
