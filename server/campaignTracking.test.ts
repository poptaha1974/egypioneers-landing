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

  it("يرسل أحداث التسجيل القياسية قبل تأخير التحويل التلقائي إلى واتساب", () => {
    const home = readFileSync(homePath, "utf8");
    const completeRegistrationIndex = home.indexOf('fbq("track", "CompleteRegistration"');
    const leadIndex = home.indexOf("FUNNELFAST_PIXEL_EVENTS.lead");
    const contactIndex = home.indexOf("FUNNELFAST_PIXEL_EVENTS.contact", leadIndex);
    const handoffIndex = home.indexOf("FUNNELFAST_PIXEL_EVENTS.whatsappHandoff", contactIndex);
    const redirectIndex = home.indexOf("window.location.assign", handoffIndex);

    expect(completeRegistrationIndex).toBeGreaterThan(-1);
    expect(leadIndex).toBeGreaterThan(completeRegistrationIndex);
    expect(contactIndex).toBeGreaterThan(leadIndex);
    expect(handoffIndex).toBeGreaterThan(contactIndex);
    expect(redirectIndex).toBeGreaterThan(handoffIndex);
    expect(home).toContain("const POST_SUBMIT_WHATSAPP_REDIRECT_DELAY_MS = 2000;");
    expect(home).toContain("}, POST_SUBMIT_WHATSAPP_REDIRECT_DELAY_MS);");
  });

  it("يقيس نقر CTA وبداية النموذج وفتح واتساب وتشغيل الفيديو دون تغيير الأحداث الأساسية", () => {
    const home = readFileSync(homePath, "utf8");

    expect(home).toContain('"CTA_Click"');
    expect(home).toContain('"FormStart"');
    expect(home).toContain('"WhatsAppOpen"');
    expect(home).toContain('"VideoPlay"');
    expect(home).toContain('"VideoComplete"');
  });
});
