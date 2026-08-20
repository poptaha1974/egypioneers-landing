export const ENGAGEMENT_SESSION_STORAGE_KEY = "egypioneers_webinar_visitor_session";

export const ENGAGEMENT_EVENT_NAMES = [
  "section_viewed",
  "faq_opened",
  "video_started",
  "video_completed",
  "cta_clicked",
  "form_started",
] as const;

export type EngagementEventName = (typeof ENGAGEMENT_EVENT_NAMES)[number];

export function getVisitorEngagementSessionId(): string {
  if (typeof window === "undefined") return "00000000-0000-4000-8000-000000000000";
  const existing = window.sessionStorage.getItem(ENGAGEMENT_SESSION_STORAGE_KEY);
  if (existing) return existing;
  const value = window.crypto?.randomUUID?.() ?? `00000000-0000-4000-8000-${Date.now().toString().padStart(12, "0").slice(-12)}`;
  window.sessionStorage.setItem(ENGAGEMENT_SESSION_STORAGE_KEY, value);
  return value;
}
