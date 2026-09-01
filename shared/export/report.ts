/**
 * تقرير الطالب — شكل واحد بيتغذّى منه العرض على الشاشة وملف CSV/Excel
 * وطباعة الـPDF. مصدر واحد يعني الأرقام مستحيل تختلف بين المخرجات.
 *
 * التقرير ده بيتبني من بيانات الطالب المطلوب فقط — مفيش أي صف لطالب تاني.
 */

import {
  FIELD_LABELS_AR,
  NOT_COLLECTED,
  dailyContributionMarginMinor,
  isCollected,
  type DailyEntry,
  type Metric,
  type PeriodMetrics,
} from "@shared/student/metrics";

export type ReportMeta = { label: string; value: string };
export type ReportKpi = { label: string; value: string; hint?: string };

export type StudentReport = {
  title: string;
  meta: ReportMeta[];
  kpis: ReportKpi[];
  columns: string[];
  rows: Array<Array<string | number>>;
  /** إعلان الحالة الإلزامي — بيتطبع في كل مخرج. */
  footnote: string;
};

const MISSING_LABEL = "غير متجمّع";

export const formatEgpMinor = (minor: Metric): string =>
  isCollected(minor)
    ? `${(minor / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })} ج.م`
    : MISSING_LABEL;

export const formatCount = (value: Metric): string =>
  isCollected(value) ? value.toLocaleString("en-US") : MISSING_LABEL;

export const formatPct = (value: Metric): string =>
  isCollected(value) ? `${(value * 100).toFixed(1)}%` : MISSING_LABEL;

export const formatRatio = (value: Metric): string =>
  isCollected(value) ? value.toFixed(2) : MISSING_LABEL;

const cellNumber = (value: number | null): string | number =>
  value === null ? "" : value;
const cellEgp = (minor: number | null): string | number =>
  minor === null ? "" : Number((minor / 100).toFixed(2));

export const REPORT_COLUMNS = [
  "التاريخ",
  FIELD_LABELS_AR.ordersPlaced,
  FIELD_LABELS_AR.ordersConfirmed,
  FIELD_LABELS_AR.ordersDelivered,
  FIELD_LABELS_AR.ordersReturned,
  `${FIELD_LABELS_AR.collectedRevenueMinor} (ج.م)`,
  `${FIELD_LABELS_AR.productCostMinor} (ج.م)`,
  `${FIELD_LABELS_AR.adSpendMinor} (ج.م)`,
  `${FIELD_LABELS_AR.shippingMinor} (ج.م)`,
  `${FIELD_LABELS_AR.collectionFeesMinor} (ج.م)`,
  `${FIELD_LABELS_AR.returnCostMinor} (ج.م)`,
  `${FIELD_LABELS_AR.variableOpsMinor} (ج.م)`,
  FIELD_LABELS_AR.leadsCount,
  FIELD_LABELS_AR.sessionsCount,
  "ربح المساهمة المسلَّم (ج.م)",
];

export function buildStudentReport(params: {
  studentName: string;
  storeName?: string | null;
  periodStart: string;
  periodEnd: string;
  entries: DailyEntry[];
  metrics: PeriodMetrics;
  decision?: string | null;
  dataQuality?: string;
  asOf?: string | null;
  generatedAt: string;
  statusDeclaration: string;
}): StudentReport {
  const rows = params.entries.map(entry => {
    const margin = dailyContributionMarginMinor(entry).value;
    return [
      entry.entryDate,
      cellNumber(entry.ordersPlaced),
      cellNumber(entry.ordersConfirmed),
      cellNumber(entry.ordersDelivered),
      cellNumber(entry.ordersReturned),
      cellEgp(entry.collectedRevenueMinor),
      cellEgp(entry.productCostMinor),
      cellEgp(entry.adSpendMinor),
      cellEgp(entry.shippingMinor),
      cellEgp(entry.collectionFeesMinor),
      cellEgp(entry.returnCostMinor),
      cellEgp(entry.variableOpsMinor),
      cellNumber(entry.leadsCount),
      cellNumber(entry.sessionsCount),
      margin === NOT_COLLECTED ? "" : Number((margin / 100).toFixed(2)),
    ];
  });

  return {
    title: `تقرير أداء — ${params.studentName}`,
    meta: [
      { label: "الطالب", value: params.studentName },
      ...(params.storeName
        ? [{ label: "المتجر", value: params.storeName }]
        : []),
      { label: "الفترة", value: `${params.periodStart} → ${params.periodEnd}` },
      ...(params.asOf ? [{ label: "استرجاع بتاريخ", value: params.asOf }] : []),
      {
        label: "أيام مكتملة",
        value: `${params.metrics.daysCovered} من ${params.metrics.daysTotal}`,
      },
      ...(params.dataQuality
        ? [{ label: "جودة البيانات", value: params.dataQuality }]
        : []),
      ...(params.decision
        ? [{ label: "قرار THINC", value: params.decision }]
        : []),
      { label: "أُنشئ في", value: params.generatedAt },
    ],
    kpis: [
      {
        label: "ربح المساهمة المسلَّم",
        value: formatEgpMinor(params.metrics.contributionMarginMinor),
      },
      {
        label: "ربح الأوردر المسلَّم",
        value: formatEgpMinor(
          params.metrics.contributionPerDeliveredOrderMinor
        ),
      },
      {
        label: "متوسط قيمة الأوردر",
        value: formatEgpMinor(params.metrics.aovMinor),
      },
      {
        label: "تكلفة الأوردر المسلَّم",
        value: formatEgpMinor(params.metrics.cpaMinor),
      },
      { label: "ROAS", value: formatRatio(params.metrics.roas) },
      {
        label: "معدل التأكيد",
        value: formatPct(params.metrics.confirmationRate),
      },
      { label: "معدل التسليم", value: formatPct(params.metrics.deliveryRate) },
      { label: "معدل المرتجع", value: formatPct(params.metrics.rtoRate) },
    ],
    columns: REPORT_COLUMNS,
    rows,
    footnote: params.statusDeclaration,
  };
}

const escapeCsv = (value: string | number): string => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * CSV بعلامة BOM عشان إكسل يقرأ العربي صح.
 * الخلية الفاضية معناها «غير متجمّع» — ومش بتتحول لصفر.
 */
export function reportToCsv(report: StudentReport): string {
  const lines: Array<Array<string | number>> = [
    [report.title],
    ...report.meta.map(item => [item.label, item.value]),
    [],
    ["المؤشر", "القيمة"],
    ...report.kpis.map(kpi => [kpi.label, kpi.value]),
    [],
    report.columns,
    ...report.rows,
    [],
    [report.footnote],
  ];

  return `﻿${lines.map(line => line.map(escapeCsv).join(",")).join("\r\n")}\r\n`;
}
