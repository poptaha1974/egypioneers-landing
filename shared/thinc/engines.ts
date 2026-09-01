import {
  FIELD_LABELS_AR,
  isCollected,
  type Metric,
} from "@shared/student/metrics";
import type {
  EngineResult,
  ThincInput,
  Uncertainty,
} from "@shared/thinc/types";

/** حدود تشغيلية للسوق المصري — COD ومرتجعات. تُراجَع بالدليل لا بالحدس. */
export const RTO_WARNING_RATE = 0.25;
export const CONFIRMATION_WARNING_RATE = 0.6;

const pct = (value: Metric): string =>
  isCollected(value) ? `${(value * 100).toFixed(1)}%` : "NOT_COLLECTED";
const egp = (minor: Metric): string =>
  isCollected(minor) ? `${Math.round(minor / 100)} ج.م` : "NOT_COLLECTED";

const uncertaintyFromCoverage = (
  covered: number,
  total: number,
  missing: number
): Uncertainty => {
  if (missing > 0 || total === 0) return "HIGH";
  const coverage = covered / total;
  if (coverage >= 0.8) return "LOW";
  if (coverage >= 0.5) return "MEDIUM";
  return "HIGH";
};

/**
 * المحركات مستقلة: كل واحد بيرجع تقييمه وقيوده وناقصه وعدم يقينه
 * وأقرب تجربة تقلل عدم اليقين. ممنوع دمجها في رقم واحد.
 */
export function runEngines(input: ThincInput): EngineResult[] {
  const { metrics } = input;
  const totals = metrics.totals;

  const economicsMissing = [
    ...(isCollected(metrics.contributionMarginMinor)
      ? []
      : ["ربح المساهمة المسلَّم"]),
    ...metrics.fullyMissingFields.map(field => FIELD_LABELS_AR[field]),
  ];

  const economics: EngineResult = {
    engine: "EconomicsEngine",
    assessment: isCollected(metrics.contributionMarginMinor)
      ? `ربح مساهمة ${egp(metrics.contributionMarginMinor)} على الفترة · ${egp(metrics.contributionPerDeliveredOrderMinor)} للأوردر المسلَّم · ROAS ${isCollected(metrics.roas) ? metrics.roas.toFixed(2) : "NOT_COLLECTED"}`
      : "ربح المساهمة غير محسوب — بنود التكلفة أو الإيراد ناقصة",
    constraints: [
      ...(isCollected(metrics.contributionPerDeliveredOrderMinor) &&
      metrics.contributionPerDeliveredOrderMinor <= 0
        ? ["ربح الأوردر المسلَّم غير موجب"]
        : []),
      ...(isCollected(metrics.cpaMinor) &&
      isCollected(metrics.aovMinor) &&
      metrics.cpaMinor >= metrics.aovMinor
        ? ["تكلفة الأوردر أعلى من متوسط قيمته"]
        : []),
    ],
    missing: economicsMissing,
    uncertainty: uncertaintyFromCoverage(
      metrics.daysCovered,
      metrics.daysTotal,
      economicsMissing.length
    ),
    nextExperiment: isCollected(metrics.contributionMarginMinor)
      ? "اختبار متغير واحد في التسعير أو تكلفة الشحن مع تسجيل Stop-Loss قبل البدء"
      : "استكمال تسجيل بنود التكلفة اليومية قبل أي تجربة إنفاق",
  };

  const operationsMissing = [
    ...(isCollected(metrics.rtoRate) ? [] : ["معدل المرتجع (RTO)"]),
    ...(isCollected(metrics.confirmationRate) ? [] : ["معدل التأكيد"]),
    ...(isCollected(metrics.deliveryRate) ? [] : ["معدل التسليم"]),
  ];

  const operations: EngineResult = {
    engine: "OperationsEngine",
    assessment: `تأكيد ${pct(metrics.confirmationRate)} · تسليم ${pct(metrics.deliveryRate)} · مرتجع ${pct(metrics.rtoRate)}`,
    constraints: [
      ...(isCollected(metrics.rtoRate) && metrics.rtoRate > RTO_WARNING_RATE
        ? [
            `معدل المرتجع ${pct(metrics.rtoRate)} فوق حد التنبيه ${RTO_WARNING_RATE * 100}%`,
          ]
        : []),
      ...(isCollected(metrics.confirmationRate) &&
      metrics.confirmationRate < CONFIRMATION_WARNING_RATE
        ? [
            `معدل التأكيد ${pct(metrics.confirmationRate)} تحت حد التنبيه ${CONFIRMATION_WARNING_RATE * 100}%`,
          ]
        : []),
    ],
    missing: operationsMissing,
    uncertainty: uncertaintyFromCoverage(
      totals.ordersDelivered.covered,
      totals.ordersDelivered.total,
      operationsMissing.length
    ),
    nextExperiment:
      isCollected(metrics.rtoRate) && metrics.rtoRate > RTO_WARNING_RATE
        ? "تجربة تأكيد مسبق قبل الشحن على شريحة واحدة مع قياس أثرها على RTO"
        : null,
  };

  const mediaMissing = isCollected(metrics.cpaMinor)
    ? []
    : ["تكلفة الأوردر من الإعلان"];
  const media: EngineResult = {
    engine: "MediaExperimentEngine",
    assessment: `تكلفة الأوردر المسلَّم ${egp(metrics.cpaMinor)} · اتجاه الربح ${describeTrend(input)}`,
    constraints:
      input.experiment === null
        ? [
            "مفيش بروتوكول تجربة مسجّل — أي إعلان دلوقتي بيتقاس بدون معيار نجاح مسبق",
          ]
        : [],
    missing: mediaMissing,
    uncertainty:
      input.trend === null
        ? "HIGH"
        : mediaMissing.length > 0
          ? "HIGH"
          : "MEDIUM",
    nextExperiment:
      input.experiment === null
        ? "تسجيل فرضية ومتغير واحد ومعيار نجاح وStop-Loss قبل أي تعديل ميزانية"
        : null,
  };

  const learning: EngineResult = {
    engine: "FounderLearningEngine",
    assessment: `${metrics.daysCovered} يوم مكتمل من ${metrics.daysTotal} — انضباط التسجيل اليومي`,
    constraints:
      metrics.daysTotal > 0 && metrics.daysCovered / metrics.daysTotal < 0.5
        ? ["انقطاع في التسجيل اليومي يضعف كل قرار لاحق"]
        : [],
    missing: [],
    uncertainty: "LOW",
    nextExperiment: null,
  };

  return [economics, operations, media, learning];
}

function describeTrend(input: ThincInput): string {
  if (input.trend === null) return "NOT_COLLECTED (عينة أقل من 8 أيام)";
  const label = {
    increasing: "صاعد",
    decreasing: "هابط",
    no_trend: "بدون اتجاه دال",
  }[input.trend.trend];
  return `${label} (Mann–Kendall τ=${input.trend.tau.toFixed(2)}، p=${input.trend.pValue.toFixed(3)})`;
}
