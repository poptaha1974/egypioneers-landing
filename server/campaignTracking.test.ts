import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FUNNELFAST_PIXEL_EVENTS } from "../client/src/lib/campaignRegistration";

const homePath = fileURLToPath(new URL("../client/src/pages/Home.tsx", import.meta.url));

describe("قياس حملة FunnelFast داخل صفحة Manus", () => {
  it("يستخدم أحداث فتح التسجيل وإتمام الـLead والتحويل إلى واتساب", () => {
    const home = readFileSync(homePath, "utf8");

    expect(home).toContain("FUNNELFAST_PIXEL_EVENTS.viewContent");
    expect(home).toContain("FUNNELFAST_PIXEL_EVENTS.formOpened");
    expect(home).toContain("FUNNELFAST_PIXEL_EVENTS.lead");
    expect(home).toContain("FUNNELFAST_PIXEL_EVENTS.contact");
    expect(home).toContain("FUNNELFAST_PIXEL_EVENTS.whatsappHandoff");
  });

  it("يحافظ على أحداث PageView وViewContent وLead القياسية المستخدمة في FunnelFast", () => {
    expect(FUNNELFAST_PIXEL_EVENTS.pageView).toBe("PageView");
    expect(FUNNELFAST_PIXEL_EVENTS.viewContent).toBe("ViewContent");
    expect(FUNNELFAST_PIXEL_EVENTS.lead).toBe("Lead");
  });
});
