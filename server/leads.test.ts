import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";

vi.mock("./db", () => ({
  createLead: vi.fn().mockResolvedValue({ id: 1, intentScore: 75, leadStatus: "HOT" }),
  getAllLeads: vi.fn().mockResolvedValue([]),
  getLeadsByStatus: vi.fn().mockResolvedValue([]),
  getDb: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

vi.mock("./academyLeadDelivery", () => ({
  deliverAcademyLead: vi.fn().mockResolvedValue(true),
}));

function createPublicCaller() {
  return appRouter.createCaller({
    user: null,
    req: {} as any,
    res: { clearCookie: vi.fn() } as any,
  });
}

describe("Leads tRPC Router - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("leads.submit - valid input", () => {
    it("should call createLead with normalized payload and return result", async () => {
      const { createLead } = await import("./db");
      const { deliverAcademyLead } = await import("./academyLeadDelivery");
      const caller = createPublicCaller();

      const result = await caller.leads.submit({
        name: "أحمد محمد",
        phone: "01012345678",
        email: "ahmed@test.com",
        role: "صاحب مشروع",
        challenge: "مش عارف أبدأ إزاي في التسويق الإلكتروني",
        stage: "شغّال ومحتاج أطوّر",
        readiness: "جاهز أبدأ دلوقتي",
        preference: "أونلاين",
        whatsappConsent: true,
      });

      expect(createLead).toHaveBeenCalledWith({
        name: "أحمد محمد",
        phone: "01012345678",
        email: "ahmed@test.com",
        role: "صاحب مشروع",
        challenge: "مش عارف أبدأ إزاي في التسويق الإلكتروني",
        stage: "شغّال ومحتاج أطوّر",
        readiness: "جاهز أبدأ دلوقتي",
        preference: "أونلاين",
        whatsappConsent: 1,
        whatsappConsentAt: expect.any(Date),
      });
      expect(deliverAcademyLead).toHaveBeenCalledWith({
        name: "أحمد محمد",
        phone: "01012345678",
        email: "ahmed@test.com",
      });
      expect((createLead as any).mock.invocationCallOrder[0]).toBeLessThan(
        (deliverAcademyLead as any).mock.invocationCallOrder[0],
      );
      expect(result).toEqual({ id: 1, intentScore: 75, leadStatus: "HOT", automationDelivered: true });
    });

    it("should handle optional fields as null when undefined", async () => {
      const { createLead } = await import("./db");
      const caller = createPublicCaller();

      await caller.leads.submit({
        name: "سارة",
        phone: "01112345678",
        email: "sara@example.com",
      });

      expect(createLead).toHaveBeenCalledWith({
        name: "سارة",
        phone: "01112345678",
        email: "sara@example.com",
        role: null,
        challenge: null,
        stage: null,
        readiness: null,
        preference: null,
        whatsappConsent: 0,
        whatsappConsentAt: null,
      });
    });

    it("keeps the registration successful when automation delivery reports a failure", async () => {
      const { deliverAcademyLead } = await import("./academyLeadDelivery");
      (deliverAcademyLead as any).mockResolvedValueOnce(false);
      const caller = createPublicCaller();

      const result = await caller.leads.submit({
        name: "منى",
        phone: "01012345678",
        email: "mona@example.com",
      });

      expect(result).toMatchObject({ id: 1, automationDelivered: false });
    });

    it("يحفظ عدم الموافقة صراحة عندما لا يطلب الزائر رسائل واتساب", async () => {
      const { createLead } = await import("./db");
      const caller = createPublicCaller();

      await caller.leads.submit({
        name: "ليلى",
        phone: "01012345678",
        email: "laila@example.com",
        whatsappConsent: false,
      });

      expect(createLead).toHaveBeenCalledWith(expect.objectContaining({
        whatsappConsent: 0,
        whatsappConsentAt: null,
      }));
    });
  });

  describe("leads.submit - invalid input (validation errors)", () => {
    it("should reject short name (< 2 chars)", async () => {
      const caller = createPublicCaller();
      await expect(caller.leads.submit({ name: "أ", phone: "01012345678", email: "test@test.com" })).rejects.toThrow();
    });

    it("should reject invalid email", async () => {
      const caller = createPublicCaller();
      await expect(caller.leads.submit({ name: "أحمد", phone: "01012345678", email: "not-an-email" })).rejects.toThrow();
    });

    it("should reject short phone (< 10 chars)", async () => {
      const caller = createPublicCaller();
      await expect(caller.leads.submit({ name: "أحمد", phone: "0101", email: "test@test.com" })).rejects.toThrow();
    });
  });

  describe("leads.submit - database failure handling", () => {
    it("should propagate error when createLead throws", async () => {
      const { createLead } = await import("./db");
      (createLead as any).mockRejectedValueOnce(new Error("Database not available"));
      const caller = createPublicCaller();

      await expect(caller.leads.submit({
        name: "أحمد",
        phone: "01012345678",
        email: "test@test.com",
      })).rejects.toThrow("Database not available");
    });
  });
});
