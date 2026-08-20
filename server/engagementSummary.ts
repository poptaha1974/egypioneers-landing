export const ENGAGEMENT_EVENT_NAMES = [
  "section_viewed",
  "faq_opened",
  "video_started",
  "video_completed",
  "cta_clicked",
  "form_started",
] as const;

export type EngagementEventName = (typeof ENGAGEMENT_EVENT_NAMES)[number];

export type EngagementEventLike = {
  eventName: EngagementEventName;
  target: string;
  occurredAt: Date;
};

export type EngagementSummary = {
  sectionsViewed: string[];
  faqsOpened: string[];
  videoStarted: boolean;
  videoCompleted: boolean;
  decisionTouches: string[];
  interactionCount: number;
  lastInteractedAt: string | null;
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

/**
 * يلخص أفعالاً تم رصدها فقط؛ لا يستنتج أن الزائر قرأ المحتوى أو قرر الشراء.
 */
export function summarizeEngagement(events: EngagementEventLike[]): EngagementSummary {
  const ordered = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const last = ordered.at(-1);

  return {
    sectionsViewed: unique(ordered.filter((event) => event.eventName === "section_viewed").map((event) => event.target)),
    faqsOpened: unique(ordered.filter((event) => event.eventName === "faq_opened").map((event) => event.target)),
    videoStarted: ordered.some((event) => event.eventName === "video_started"),
    videoCompleted: ordered.some((event) => event.eventName === "video_completed"),
    decisionTouches: unique(ordered
      .filter((event) => event.eventName === "cta_clicked" || event.eventName === "form_started")
      .map((event) => event.target)),
    interactionCount: ordered.length,
    lastInteractedAt: last?.occurredAt.toISOString() ?? null,
  };
}
