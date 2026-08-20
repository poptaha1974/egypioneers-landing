import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverAcademyLead } from "./academyLeadDelivery";

const payload = {
  name: "أحمد محمد",
  phone: "01012345678",
  email: "ahmed@example.com",
  event_id: "lead_1724110000000_abc123def456",
  event_source_url: "https://webinar.popehab.com/?fbclid=IwZXh0bgNhZW0CMTEAAR0_test",
  fbclid: "IwZXh0bgNhZW0CMTEAAR0_test",
  fbp: "fb.1.1724110000000.123456789",
};

describe("تسليم تسجيل الأكاديمية إلى الأتمتة", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("يعيد نجاحاً عند استجابة webhook ناجحة", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    await expect(deliverAcademyLead(payload, request)).resolves.toBe(true);
    expect(request).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify(payload),
        method: "POST",
      }),
    );
  });

  it("يعيد فشلاً قابلاً للرصد عند استجابة webhook غير ناجحة", async () => {
    const request = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(deliverAcademyLead(payload, request)).resolves.toBe(false);
    expect(warning).toHaveBeenCalledWith(
      "[Academy lead delivery] Webhook delivery failed",
      { status: 503 },
    );
  });

  it("يعيد فشلاً قابلاً للرصد عند تعذر الوصول إلى webhook", async () => {
    const request = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(deliverAcademyLead(payload, request)).resolves.toBe(false);
    expect(warning).toHaveBeenCalledOnce();
  });
});
