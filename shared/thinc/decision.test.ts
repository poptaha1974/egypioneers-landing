import { describe, expect, it } from "vitest";

import {
  dataQualityStatus,
  periodMetrics,
  type DailyEntry,
} from "@shared/student/metrics";
import { mannKendall } from "@shared/student/timeseries";
import { ALLOWED_DECISIONS, evaluateThinc } from "./decision";
import { gateStatus } from "./gates";
import type { RegisteredExperiment, ThincInput } from "./types";

const blank: Omit<DailyEntry, "entryDate"> = {
  ordersPlaced: null,
  ordersConfirmed: null,
  ordersDelivered: null,
  ordersReturned: null,
  collectedRevenueMinor: null,
  productCostMinor: null,
  adSpendMinor: null,
  shippingMinor: null,
  collectionFeesMinor: null,
  returnCostMinor: null,
  variableOpsMinor: null,
  leadsCount: null,
  sessionsCount: null,
};

const healthyDay = (
  index: number,
  overrides: Partial<DailyEntry> = {}
): DailyEntry => ({
  entryDate: `2026-08-${String(index + 1).padStart(2, "0")}`,
  ...blank,
  ordersPlaced: 10,
  ordersConfirmed: 9,
  ordersDelivered: 8,
  ordersReturned: 1,
  collectedRevenueMinor: 440_00,
  productCostMinor: 200_00,
  adSpendMinor: 80_00,
  shippingMinor: 48_00,
  collectionFeesMinor: 8_00,
  returnCostMinor: 10_00,
  variableOpsMinor: 20_00,
  leadsCount: 40,
  sessionsCount: 300,
  ...overrides,
});

const protocol: RegisteredExperiment = {
  hypothesis: "خفض الشحن يرفع التأكيد",
  primaryVariable: "سعر الشحن",
  unitOfAnalysis: "الأوردر",
  successCriterion: "تأكيد +5 نقاط",
  stopLoss: "وقف عند خسارة 3000 ج.م",
  registeredAt: "2026-08-01T00:00:00.000Z",
};

const buildInput = (
  entries: DailyEntry[],
  overrides: Partial<ThincInput> = {}
): ThincInput => {
  const metrics = periodMetrics(entries);
  const contribution = entries.map((entry, index) => ({
    date: entry.entryDate,
    value: entry.collectedRevenueMinor === null ? null : 54_00 + index,
  }));
  return {
    metrics,
    dataQuality: dataQualityStatus(metrics),
    daysObserved: entries.length,
    evidenceAsOf: entries.at(-1)?.entryDate ?? null,
    trend: mannKendall(contribution),
    compliance: { blockers: [] },
    liquidity: { runwayDays: 90 },
    experiment: protocol,
    humanApproval: null,
    ...overrides,
  };
};

const twentyHealthyDays = Array.from({ length: 20 }, (_, index) =>
  healthyDay(index)
);

describe("بوابات THINC", () => {
  it("بوابة بدون مُدخل تبقى NOT_EVALUABLE لا PASS ولا FAIL", () => {
    const result = evaluateThinc(
      buildInput(twentyHealthyDays, { compliance: null, liquidity: null })
    );
    expect(gateStatus(result.gates, "COMPLIANCE")).toBe("NOT_EVALUABLE");
    expect(gateStatus(result.gates, "LIQUIDITY")).toBe("NOT_EVALUABLE");
    expect(result.missing.some(entry => entry.field === "COMPLIANCE")).toBe(
      true
    );
  });

  it("DELIVERED_PROFIT ما تتقيّمش إلا لما القرار المطلوب SCALE", () => {
    expect(
      gateStatus(
        evaluateThinc(buildInput(twentyHealthyDays)).gates,
        "DELIVERED_PROFIT"
      )
    ).toBe("NOT_EVALUATED");
    const scale = evaluateThinc(
      buildInput(twentyHealthyDays, {
        requestedDecision: "SCALE",
        humanApproval: { approvedBy: "د. أيهاب", approvedAt: "2026-08-21" },
      }),
      new Date("2026-08-22T00:00:00Z")
    );
    expect(gateStatus(scale.gates, "DELIVERED_PROFIT")).toBe("PASS");
  });

  it("بروتوكول ناقص بند واحد يسقط البوابة", () => {
    const result = evaluateThinc(
      buildInput(twentyHealthyDays, {
        experiment: { ...protocol, stopLoss: "  " },
      })
    );
    const gate = result.gates.find(
      entry => entry.gate === "EXPERIMENT_PROTOCOL"
    );
    expect(gate?.status).toBe("FAIL");
    expect(gate?.reason).toContain("Stop-Loss");
  });
});

describe("القرارات السبعة", () => {
  it("مانع امتثال يخرج القرار HOLD مهما كانت الأرقام كويسة", () => {
    const result = evaluateThinc(
      buildInput(twentyHealthyDays, {
        compliance: { blockers: ["ادعاء طبي في الإعلان"] },
      })
    );
    expect(result.decision).toBe("HOLD");
  });

  it("سيولة تحت الحد تخرج القرار HOLD", () => {
    expect(
      evaluateThinc(
        buildInput(twentyHealthyDays, { liquidity: { runwayDays: 10 } })
      ).decision
    ).toBe("HOLD");
  });

  it("ربح غير قابل للحساب يخرج RESEARCH لا KILL", () => {
    const entries = twentyHealthyDays.map(entry => ({
      ...entry,
      returnCostMinor: null,
    }));
    const result = evaluateThinc(buildInput(entries));
    expect(result.decision).toBe("RESEARCH");
    expect(result.dataQuality).toBe("INSUFFICIENT");
  });

  it("تغطية ناقصة تخرج RESEARCH", () => {
    const entries = twentyHealthyDays.map((entry, index) =>
      index % 2 === 0 ? entry : { ...entry, collectedRevenueMinor: null }
    );
    expect(evaluateThinc(buildInput(entries)).decision).toBe("RESEARCH");
  });

  it("خلل تشغيلي مع ربح موجب يخرج FIX", () => {
    const entries = twentyHealthyDays.map(entry => ({
      ...entry,
      ordersReturned: 6,
      ordersDelivered: 8,
    }));
    const result = evaluateThinc(buildInput(entries));
    expect(result.decision).toBe("FIX");
    expect(result.decisionReasons.join(" ")).toContain("المرتجع");
  });

  it("ربح غير موجب على عينة كافية واتجاه هابط يخرج KILL", () => {
    const entries = twentyHealthyDays.map(entry => ({
      ...entry,
      collectedRevenueMinor: 200_00,
    }));
    const input = buildInput(entries);
    const losing = {
      ...input,
      trend: mannKendall(
        entries.map((entry, index) => ({
          date: entry.entryDate,
          value: 100 - index * 5,
        }))
      ),
    };
    expect(evaluateThinc(losing).decision).toBe("KILL");
  });

  it("ربح غير موجب من غير اتجاه هابط ولا خلل تشغيلي يخرج REPOSITION", () => {
    const entries = twentyHealthyDays.map(entry => ({
      ...entry,
      collectedRevenueMinor: 200_00,
    }));
    const input = buildInput(entries);
    const flat = {
      ...input,
      trend: mannKendall(
        entries.map((entry, index) => ({
          date: entry.entryDate,
          value: index % 2 === 0 ? 10 : 11,
        }))
      ),
    };
    expect(evaluateThinc(flat).decision).toBe("REPOSITION");
  });

  it("عينة صغيرة وربح سالب تخرج TEST مش KILL", () => {
    const entries = twentyHealthyDays
      .slice(0, 5)
      .map(entry => ({ ...entry, collectedRevenueMinor: 200_00 }));
    expect(evaluateThinc(buildInput(entries)).decision).toBe("TEST");
  });

  it("SCALE يتطلب الشروط كلها — وغياب الموافقة البشرية يمنعه", () => {
    const blocked = evaluateThinc(
      buildInput(twentyHealthyDays, { requestedDecision: "SCALE" }),
      new Date("2026-08-22T00:00:00Z")
    );
    expect(blocked.decision).toBe("TEST");
    expect(blocked.decisionReasons.join(" ")).toContain("الموافقة البشرية");

    const approved = evaluateThinc(
      buildInput(twentyHealthyDays, {
        requestedDecision: "SCALE",
        humanApproval: { approvedBy: "د. أيهاب", approvedAt: "2026-08-21" },
      }),
      new Date("2026-08-22T00:00:00Z")
    );
    expect(approved.decision).toBe("SCALE");
  });

  it("دليل قديم يمنع SCALE حتى مع ربح موجب وموافقة", () => {
    const stale = evaluateThinc(
      buildInput(twentyHealthyDays, {
        requestedDecision: "SCALE",
        humanApproval: { approvedBy: "د. أيهاب", approvedAt: "2026-08-21" },
      }),
      new Date("2026-10-01T00:00:00Z")
    );
    expect(stale.decision).toBe("TEST");
    expect(stale.decisionReasons.join(" ")).toContain("مش حديث");
  });

  it("كل قرار بيرجع من القائمة المسموحة ومعاه حقول الحوكمة", () => {
    const result = evaluateThinc(buildInput(twentyHealthyDays));
    expect(ALLOWED_DECISIONS).toContain(result.decision);
    expect(result.schemaVersion).toBeTruthy();
    expect(result.modelVersion).toBeTruthy();
    expect(result.statusDeclaration).toContain("Research Preview");
    expect(result.evidenceAsOf).toBe("2026-08-20");
  });
});
