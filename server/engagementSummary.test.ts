import { describe, expect, it } from "vitest";
import { summarizeEngagement } from "./engagementSummary";

describe("summarizeEngagement", () => {
  it("يلخص الأفعال المرصودة بلا تكرار ولا استنتاج لنية شراء", () => {
    const summary = summarizeEngagement([
      { eventName: "section_viewed", target: "hero_offer", occurredAt: new Date("2026-08-20T18:00:00.000Z") },
      { eventName: "section_viewed", target: "hero_offer", occurredAt: new Date("2026-08-20T18:00:01.000Z") },
      { eventName: "faq_opened", target: "faq_5", occurredAt: new Date("2026-08-20T18:00:02.000Z") },
      { eventName: "video_started", target: "pilot_video", occurredAt: new Date("2026-08-20T18:00:03.000Z") },
      { eventName: "cta_clicked", target: "Final CTA", occurredAt: new Date("2026-08-20T18:00:04.000Z") },
    ]);

    expect(summary.sectionsViewed).toEqual(["hero_offer"]);
    expect(summary.faqsOpened).toEqual(["faq_5"]);
    expect(summary.videoStarted).toBe(true);
    expect(summary.videoCompleted).toBe(false);
    expect(summary.decisionTouches).toEqual(["Final CTA"]);
    expect(summary.interactionCount).toBe(5);
    expect(summary.lastInteractedAt).toBe("2026-08-20T18:00:04.000Z");
  });

  it("يعيد ملخصاً صفرياً عند غياب أي حدث", () => {
    expect(summarizeEngagement([])).toEqual({
      sectionsViewed: [],
      faqsOpened: [],
      videoStarted: false,
      videoCompleted: false,
      decisionTouches: [],
      interactionCount: 0,
      lastInteractedAt: null,
    });
  });
});
