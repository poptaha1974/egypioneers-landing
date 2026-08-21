import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildDraftRegistrationPayload,
  getOrCreateDraftVisitorSessionId,
} from "./campaignDelivery.v2.draft";

describe("campaignDelivery.v2.draft", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("يفكك UTM ويحفظ raw URL ولا يحول utm_id إلى ad_id", () => {
    vi.stubGlobal("window", {
      location: { href: "https://preview.test/?utm_source=meta&utm_medium=paid_social&utm_campaign=test&utm_content=c01_map&utm_id=not-an-ad-id&fbclid=test123" },
      navigator: { userAgent: "DraftBrowser/1.0" },
      sessionStorage: { getItem: () => null, setItem: vi.fn() },
    });
    vi.stubGlobal("document", { cookie: "_fbp=fb.1.test.123" });

    const payload = buildDraftRegistrationPayload({
      name: "TEST_UTM_LEAD",
      phone: "01000000000",
      email: "test@example.com",
      registrationEventId: "registration_fixed_001",
      visitorSessionId: "draft_session_fixed_001",
    });

    expect(payload).toMatchObject({
      test_mode: true,
      registration_event_id: "registration_fixed_001",
      visitor_session_id: "draft_session_fixed_001",
      phone: "201000000000",
      tracking: {
        utm_source: "meta",
        utm_content: "c01_map",
        utm_id: "not-an-ad-id",
        ad_id: null,
        fbclid: "test123",
        fbp: "fb.1.test.123",
      },
    });
  });

  it("يثبت visitor_session_id داخل نفس جلسة الاختبار", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });
    vi.stubGlobal("crypto", { randomUUID: () => "draft-session-uuid" });

    expect(getOrCreateDraftVisitorSessionId()).toBe("draft_session_draftsessionuuid");
    expect(getOrCreateDraftVisitorSessionId()).toBe("draft_session_draftsessionuuid");
  });
});
