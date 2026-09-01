import { describe, expect, it } from "vitest";

import {
  NOT_COLLECTED,
  contributionSeries,
  dailyContributionMarginMinor,
  dataQualityStatus,
  periodMetrics,
  sumField,
  type DailyEntry,
} from "./metrics";

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

const day = (
  entryDate: string,
  overrides: Partial<DailyEntry> = {}
): DailyEntry => ({
  entryDate,
  ...blank,
  ...overrides,
});

const fullDay = (
  entryDate: string,
  overrides: Partial<DailyEntry> = {}
): DailyEntry =>
  day(entryDate, {
    ordersPlaced: 20,
    ordersConfirmed: 16,
    ordersDelivered: 12,
    ordersReturned: 4,
    collectedRevenueMinor: 660_00,
    productCostMinor: 300_00,
    adSpendMinor: 150_00,
    shippingMinor: 72_00,
    collectionFeesMinor: 12_00,
    returnCostMinor: 20_00,
    variableOpsMinor: 30_00,
    leadsCount: 60,
    sessionsCount: 400,
    ...overrides,
  });

describe("ربح المساهمة اليومي", () => {
  it("يحسب الإيراد ناقص كل بنود التكلفة لما تكون مكتملة", () => {
    const { value, missing } = dailyContributionMarginMinor(
      fullDay("2026-08-01")
    );
    expect(missing).toEqual([]);
    expect(value).toBe(
      660_00 - (300_00 + 150_00 + 72_00 + 12_00 + 20_00 + 30_00)
    );
  });

  it("يرجّع NOT_COLLECTED ولا يحوّل البند الناقص لصفر", () => {
    const { value, missing } = dailyContributionMarginMinor(
      fullDay("2026-08-01", { shippingMinor: null })
    );
    expect(value).toBe(NOT_COLLECTED);
    expect(missing).toContain("shippingMinor");
  });
});

describe("تجميع الفترة", () => {
  it("يجمع الأيام المتاحة ويعلن الأيام الناقصة صراحةً", () => {
    const entries = [
      fullDay("2026-08-01"),
      day("2026-08-02", { adSpendMinor: 100_00 }),
      fullDay("2026-08-03"),
    ];
    const adSpend = sumField(entries, "adSpendMinor");
    expect(adSpend).toMatchObject({
      sum: 150_00 + 100_00 + 150_00,
      covered: 3,
      total: 3,
      missingDates: [],
    });

    const revenue = sumField(entries, "collectedRevenueMinor");
    expect(revenue.covered).toBe(2);
    expect(revenue.missingDates).toEqual(["2026-08-02"]);
  });

  it("يرجّع NOT_COLLECTED للحقل اللي مفيهوش ولا يوم", () => {
    expect(sumField([day("2026-08-01")], "adSpendMinor").sum).toBe(
      NOT_COLLECTED
    );
  });

  it("يوقف حساب ربح الفترة لو أي بند تكلفة غايب تماماً", () => {
    const metrics = periodMetrics([
      fullDay("2026-08-01", { returnCostMinor: null }),
    ]);
    expect(metrics.contributionMarginMinor).toBe(NOT_COLLECTED);
    expect(metrics.fullyMissingFields).toContain("returnCostMinor");
  });

  it("يحسب المشتقات من المجاميع المكتملة", () => {
    const metrics = periodMetrics([
      fullDay("2026-08-01"),
      fullDay("2026-08-02"),
    ]);
    expect(metrics.aovMinor).toBe(660_00 / 12);
    expect(metrics.cpaMinor).toBe(150_00 / 12);
    expect(metrics.roas).toBeCloseTo(660 / 150, 5);
    expect(metrics.confirmationRate).toBeCloseTo(16 / 20, 5);
    expect(metrics.deliveryRate).toBeCloseTo(12 / 16, 5);
    expect(metrics.rtoRate).toBeCloseTo(4 / 16, 5);
  });

  it("يمنع القسمة على صفر بدل ما يرجّع لا نهاية", () => {
    const metrics = periodMetrics([
      fullDay("2026-08-01", { ordersDelivered: 0, ordersReturned: 0 }),
    ]);
    expect(metrics.aovMinor).toBe(NOT_COLLECTED);
    expect(metrics.rtoRate).toBe(NOT_COLLECTED);
  });
});

describe("جودة البيانات", () => {
  it("يصنّف التغطية إلى OK وPARTIAL وINSUFFICIENT", () => {
    const complete = Array.from({ length: 10 }, (_, index) =>
      fullDay(`2026-08-${String(index + 1).padStart(2, "0")}`)
    );
    expect(dataQualityStatus(periodMetrics(complete))).toBe("OK");

    const half = complete.map((entry, index) =>
      index % 2 === 0 ? entry : day(entry.entryDate)
    );
    expect(dataQualityStatus(periodMetrics(half))).toBe("PARTIAL");

    expect(
      dataQualityStatus(
        periodMetrics(complete.map(entry => day(entry.entryDate)))
      )
    ).toBe("INSUFFICIENT");
  });
});

describe("سلسلة الربح اليومي", () => {
  it("يسيب اليوم الناقص null عشان الرسم ما يرسمش صفر كذب", () => {
    const series = contributionSeries([
      fullDay("2026-08-01"),
      day("2026-08-02"),
    ]);
    expect(series[1]).toEqual({ date: "2026-08-02", value: null });
    expect(series[0].value).toBeGreaterThan(0);
  });
});
