import { and, gte, lte } from "drizzle-orm";

import { purchases } from "../drizzle/schema";
import {
  dataQualityStatus,
  isCollected,
  periodMetrics,
  type Metric,
} from "@shared/student/metrics";
import { getDb } from "./db";
import { crmFunnelCounts, type CrmStage } from "./crmDb";
import { listDailyEntries, listStudents } from "./studentsDb";
import { sheetSyncBacklog } from "./sheetSync";

/**
 * تقارير ERP التشغيلية للإدارة.
 *
 * الأكاديمية والطلاب خطّين منفصلين عن قصد:
 * إيراد الأكاديمية بييجي من جدول المدفوعات المؤكدة،
 * وأداء متاجر الطلاب بييجي من إدخالاتهم اليومية.
 * ممنوع جمعهم في رقم واحد.
 */

export type StudentPerformanceRow = {
  studentId: number;
  fullName: string;
  cohort: string | null;
  status: string;
  daysCovered: number;
  daysTotal: number;
  dataQuality: string;
  contributionMarginMinor: Metric;
  collectedRevenueMinor: Metric;
  adSpendMinor: Metric;
  ordersDelivered: Metric;
  rtoRate: Metric;
};

export type ErpReport = {
  periodStart: string;
  periodEnd: string;
  academy: {
    paidCount: number;
    refundedCount: number;
    collectedMinor: number;
    currency: string | null;
  };
  studentsByStatus: Array<{ status: string; count: number }>;
  coverage: {
    studentsWithAnyEntry: number;
    studentsTotal: number;
    fullyMissing: number;
  };
  students: StudentPerformanceRow[];
  crmFunnel: Array<{ stage: CrmStage; count: number }>;
  sheetSync: { pending: number; failed: number; configured: boolean };
  generatedAt: string;
};

export async function buildErpReport(
  periodStart: string,
  periodEnd: string
): Promise<ErpReport> {
  const db = await getDb();
  const roster = await listStudents();

  const academyRows = db
    ? await db
        .select()
        .from(purchases)
        .where(
          and(
            gte(purchases.createdAt, new Date(`${periodStart}T00:00:00Z`)),
            lte(purchases.createdAt, new Date(`${periodEnd}T23:59:59Z`))
          )
        )
    : [];

  const paid = academyRows.filter(row => row.paymentStatus === "paid");

  const performance: StudentPerformanceRow[] = [];
  for (const student of roster) {
    const entries = await listDailyEntries(student.id, periodStart, periodEnd);
    const metrics = periodMetrics(entries);
    performance.push({
      studentId: student.id,
      fullName: student.fullName,
      cohort: student.cohort,
      status: student.status,
      daysCovered: metrics.daysCovered,
      daysTotal: metrics.daysTotal,
      dataQuality: dataQualityStatus(metrics),
      contributionMarginMinor: metrics.contributionMarginMinor,
      collectedRevenueMinor: metrics.totals.collectedRevenueMinor.sum,
      adSpendMinor: metrics.totals.adSpendMinor.sum,
      ordersDelivered: metrics.totals.ordersDelivered.sum,
      rtoRate: metrics.rtoRate,
    });
  }

  const statusCounts = new Map<string, number>();
  for (const student of roster) {
    statusCounts.set(
      student.status,
      (statusCounts.get(student.status) ?? 0) + 1
    );
  }

  return {
    periodStart,
    periodEnd,
    academy: {
      paidCount: paid.length,
      refundedCount: academyRows.filter(row => row.paymentStatus === "refunded")
        .length,
      collectedMinor: paid.reduce((sum, row) => sum + row.amountMinor, 0),
      currency: paid[0]?.currency ?? null,
    },
    studentsByStatus: Array.from(statusCounts.entries()).map(
      ([status, count]) => ({ status, count })
    ),
    coverage: {
      studentsWithAnyEntry: performance.filter(row => row.daysTotal > 0).length,
      studentsTotal: roster.length,
      fullyMissing: performance.filter(
        row => !isCollected(row.contributionMarginMinor)
      ).length,
    },
    students: performance.sort(
      (a, b) =>
        rankMargin(b.contributionMarginMinor) -
        rankMargin(a.contributionMarginMinor)
    ),
    crmFunnel: await crmFunnelCounts(),
    sheetSync: await sheetSyncBacklog(),
    generatedAt: new Date().toISOString(),
  };
}

/** الطلاب اللي بياناتهم ناقصة بينزلوا آخر القائمة بدل ما يتحسبوا صفر. */
const rankMargin = (value: Metric): number =>
  isCollected(value) ? value : Number.NEGATIVE_INFINITY;
