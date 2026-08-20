import { afterEach, describe, expect, it, vi } from "vitest";
import { captureMetaLeadAttribution } from "./campaignDelivery";

describe("captureMetaLeadAttribution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("يلتقط fbclid و_fbp ويولد event_id واحداً لمسار Browser وCAPI", () => {
    vi.stubGlobal("window", {
      location: {
        search: "?utm_source=meta&fbclid=IwZXh0bgNhZW0CMTEST",
        href: "https://webinar.popehab.com/?utm_source=meta&fbclid=IwZXh0bgNhZW0CMTEST",
      },
    });
    vi.stubGlobal("document", {
      cookie: "theme=dark; _fbp=fb.1.1724110000000.123456789; locale=ar",
    });
    vi.stubGlobal("crypto", {
      randomUUID: () => "12345678-1234-5678-1234-567812345678",
    });

    const attribution = captureMetaLeadAttribution();

    expect(attribution).toMatchObject({
      fbclid: "IwZXh0bgNhZW0CMTEST",
      fbp: "fb.1.1724110000000.123456789",
      eventSourceUrl: "https://webinar.popehab.com/?utm_source=meta&fbclid=IwZXh0bgNhZW0CMTEST",
    });
    expect(attribution.eventId).toMatch(/^lead_\d+_12345678123456781234567812345678$/);
  });

  it("يحافظ على event_id حتى إذا لم تكن معرّفات Meta متاحة", () => {
    vi.stubGlobal("window", { location: { search: "", href: "https://webinar.popehab.com/" } });
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("crypto", { randomUUID: () => "empty-case" });

    expect(captureMetaLeadAttribution()).toMatchObject({
      eventId: expect.stringMatching(/^lead_\d+_emptycase$/),
      eventSourceUrl: "https://webinar.popehab.com/",
      fbclid: undefined,
      fbp: undefined,
    });
  });
});
