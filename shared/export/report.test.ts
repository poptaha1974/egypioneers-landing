import { describe, expect, it } from "vitest";

import { periodMetrics, type DailyEntry } from "@shared/student/metrics";
import { REPORT_COLUMNS, buildStudentReport, reportToCsv } from "./report";

const entry = (overrides: Partial<DailyEntry> = {}): DailyEntry => ({
  entryDate: "2026-08-01",
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

const build = (entries: DailyEntry[]) =>
  buildStudentReport({
    studentName: "أحمد",
    storeName: "متجر أحمد",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-02",
    entries,
    metrics: periodMetrics(entries),
    decision: "TEST",
    dataQuality: "OK",
    generatedAt: "2026-08-03T09:00:00.000Z",
    statusDeclaration: "Research Preview — غير متحقق ميدانياً",
  });

describe("تقرير الطالب", () => {
  it("يبني صف لكل يوم بنفس عدد الأعمدة", () => {
    const report = build([entry(), entry({ entryDate: "2026-08-02" })]);
    expect(report.rows).toHaveLength(2);
    expect(report.rows.every(row => row.length === REPORT_COLUMNS.length)).toBe(
      true
    );
  });

  it("يسيب البند الناقص خلية فاضية ويوقف ربح اليوم", () => {
    const report = build([entry({ adSpendMinor: null })]);
    const row = report.rows[0];
    expect(row[REPORT_COLUMNS.indexOf("مصروف الإعلان (ج.م)")]).toBe("");
    expect(row[REPORT_COLUMNS.indexOf("ربح المساهمة المسلَّم (ج.م)")]).toBe("");
  });

  it("يعرض المؤشر الناقص كـ«غير متجمّع» مش صفر", () => {
    const report = build([entry({ adSpendMinor: null })]);
    expect(report.kpis.find(kpi => kpi.label === "ROAS")?.value).toBe(
      "غير متجمّع"
    );
  });

  it("CSV بيبدأ بـBOM وبيحتوي إعلان الحالة", () => {
    const csv = reportToCsv(build([entry()]));
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("Research Preview");
    expect(csv).toContain("تقرير أداء — أحمد");
  });

  it("CSV بيهرّب الفواصل وعلامات التنصيص", () => {
    const report = build([entry()]);
    report.meta.push({ label: "ملاحظة", value: 'قال "تمام", وخلاص' });
    expect(reportToCsv(report)).toContain('"قال ""تمام"", وخلاص"');
  });
});
