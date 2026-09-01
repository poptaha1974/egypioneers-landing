/**
 * مؤشرات الطالب اليومية.
 *
 * مبدأ THINC رقم 2 محكوم هنا: أي مُدخل غير موجود يفضل `NOT_COLLECTED`
 * ولا يتحول لصفر أبداً. أي مشتق ينقصه مُدخل بيرجع `NOT_COLLECTED` كمان،
 * والتغطية (كام يوم فيه القيمة من كام يوم) بترجع مع كل تجميع.
 */

export const NOT_COLLECTED = "NOT_COLLECTED" as const;
export type NotCollected = typeof NOT_COLLECTED;
export type Metric = number | NotCollected;

export const isCollected = (value: Metric): value is number =>
  value !== NOT_COLLECTED;

export type DailyEntry = {
  entryDate: string;
  ordersPlaced: number | null;
  ordersConfirmed: number | null;
  ordersDelivered: number | null;
  ordersReturned: number | null;
  collectedRevenueMinor: number | null;
  productCostMinor: number | null;
  adSpendMinor: number | null;
  shippingMinor: number | null;
  collectionFeesMinor: number | null;
  returnCostMinor: number | null;
  variableOpsMinor: number | null;
  leadsCount: number | null;
  sessionsCount: number | null;
};

export type NumericField = Exclude<keyof DailyEntry, "entryDate">;

/** بنود التكلفة اللي بتُخصم من الإيراد المحصَّل في ربح المساهمة المسلَّم. */
export const CONTRIBUTION_COST_FIELDS = [
  "productCostMinor",
  "adSpendMinor",
  "shippingMinor",
  "collectionFeesMinor",
  "returnCostMinor",
  "variableOpsMinor",
] as const satisfies readonly NumericField[];

export const NUMERIC_FIELDS = [
  "ordersPlaced",
  "ordersConfirmed",
  "ordersDelivered",
  "ordersReturned",
  "collectedRevenueMinor",
  ...CONTRIBUTION_COST_FIELDS,
  "leadsCount",
  "sessionsCount",
] as const satisfies readonly NumericField[];

export const FIELD_LABELS_AR: Record<NumericField, string> = {
  ordersPlaced: "أوردرات واردة",
  ordersConfirmed: "أوردرات مؤكدة",
  ordersDelivered: "أوردرات مسلَّمة",
  ordersReturned: "أوردرات مرتجعة",
  collectedRevenueMinor: "إيراد محصَّل",
  productCostMinor: "تكلفة المنتج",
  adSpendMinor: "مصروف الإعلان",
  shippingMinor: "الشحن",
  collectionFeesMinor: "رسوم التحصيل",
  returnCostMinor: "تكلفة المرتجع",
  variableOpsMinor: "تشغيل متغير",
  leadsCount: "ليدز",
  sessionsCount: "جلسات",
};

/**
 * ربح المساهمة المسلَّم لليوم الواحد.
 * لو أي بند ناقص، النتيجة `NOT_COLLECTED` — مش مجموع جزئي بيوهم إنه ربح.
 */
export function dailyContributionMarginMinor(entry: DailyEntry): {
  value: Metric;
  missing: NumericField[];
} {
  const missing: NumericField[] = [];
  if (entry.collectedRevenueMinor === null)
    missing.push("collectedRevenueMinor");
  for (const field of CONTRIBUTION_COST_FIELDS) {
    if (entry[field] === null) missing.push(field);
  }
  if (missing.length > 0) return { value: NOT_COLLECTED, missing };

  const costs = CONTRIBUTION_COST_FIELDS.reduce(
    (sum, field) => sum + (entry[field] as number),
    0
  );
  return { value: (entry.collectedRevenueMinor as number) - costs, missing };
}

export type FieldCoverage = {
  sum: Metric;
  covered: number;
  total: number;
  missingDates: string[];
};

/** مجموع حقل على مدى فترة، مع تغطية صريحة بدل الصمت على الأيام الناقصة. */
export function sumField(
  entries: DailyEntry[],
  field: NumericField
): FieldCoverage {
  const missingDates: string[] = [];
  let sum = 0;
  let covered = 0;

  for (const entry of entries) {
    const value = entry[field];
    if (value === null) {
      missingDates.push(entry.entryDate);
      continue;
    }
    sum += value;
    covered += 1;
  }

  return {
    sum: covered === 0 ? NOT_COLLECTED : sum,
    covered,
    total: entries.length,
    missingDates,
  };
}

export type PeriodTotals = Record<NumericField, FieldCoverage>;

export function periodTotals(entries: DailyEntry[]): PeriodTotals {
  return Object.fromEntries(
    NUMERIC_FIELDS.map(field => [field, sumField(entries, field)])
  ) as PeriodTotals;
}

const ratio = (numerator: Metric, denominator: Metric): Metric => {
  if (!isCollected(numerator) || !isCollected(denominator))
    return NOT_COLLECTED;
  if (denominator === 0) return NOT_COLLECTED;
  return numerator / denominator;
};

const subtract = (base: Metric, ...others: Metric[]): Metric => {
  if (!isCollected(base)) return NOT_COLLECTED;
  let result = base;
  for (const other of others) {
    if (!isCollected(other)) return NOT_COLLECTED;
    result -= other;
  }
  return result;
};

export type PeriodMetrics = {
  totals: PeriodTotals;
  /** ربح المساهمة المسلَّم للفترة — يتطلب اكتمال الإيراد وكل بنود التكلفة. */
  contributionMarginMinor: Metric;
  contributionPerDeliveredOrderMinor: Metric;
  aovMinor: Metric;
  cpaMinor: Metric;
  roas: Metric;
  confirmationRate: Metric;
  deliveryRate: Metric;
  rtoRate: Metric;
  leadToOrderRate: Metric;
  /** الحقول اللي مفيهاش ولا يوم مسجّل في الفترة كلها. */
  fullyMissingFields: NumericField[];
  daysCovered: number;
  daysTotal: number;
};

export function periodMetrics(entries: DailyEntry[]): PeriodMetrics {
  const totals = periodTotals(entries);
  const value = (field: NumericField): Metric => totals[field].sum;

  const contributionMarginMinor = subtract(
    value("collectedRevenueMinor"),
    ...CONTRIBUTION_COST_FIELDS.map(value)
  );

  const deliveredPlusReturned = (() => {
    const delivered = value("ordersDelivered");
    const returned = value("ordersReturned");
    if (!isCollected(delivered) || !isCollected(returned)) return NOT_COLLECTED;
    return delivered + returned;
  })();

  return {
    totals,
    contributionMarginMinor,
    contributionPerDeliveredOrderMinor: ratio(
      contributionMarginMinor,
      value("ordersDelivered")
    ),
    aovMinor: ratio(value("collectedRevenueMinor"), value("ordersDelivered")),
    cpaMinor: ratio(value("adSpendMinor"), value("ordersDelivered")),
    roas: ratio(value("collectedRevenueMinor"), value("adSpendMinor")),
    confirmationRate: ratio(value("ordersConfirmed"), value("ordersPlaced")),
    deliveryRate: ratio(value("ordersDelivered"), value("ordersConfirmed")),
    rtoRate: ratio(value("ordersReturned"), deliveredPlusReturned),
    leadToOrderRate: ratio(value("ordersPlaced"), value("leadsCount")),
    fullyMissingFields: NUMERIC_FIELDS.filter(
      field => totals[field].covered === 0
    ),
    daysCovered: entries.filter(
      entry => dailyContributionMarginMinor(entry).value !== NOT_COLLECTED
    ).length,
    daysTotal: entries.length,
  };
}

export type DataQualityStatus = "OK" | "PARTIAL" | "INSUFFICIENT";

/**
 * جودة البيانات = نسبة الأيام المكتملة اقتصادياً في الفترة.
 * مش درجة كلية ولا بتتقاصّ مع أي بُعد تاني.
 */
export function dataQualityStatus(metrics: PeriodMetrics): DataQualityStatus {
  if (metrics.daysTotal === 0 || metrics.daysCovered === 0)
    return "INSUFFICIENT";
  const coverage = metrics.daysCovered / metrics.daysTotal;
  if (coverage >= 0.8) return "OK";
  if (coverage >= 0.4) return "PARTIAL";
  return "INSUFFICIENT";
}

/** سلسلة ربح المساهمة اليومي — الأيام الناقصة بترجع null مش صفر. */
export function contributionSeries(
  entries: DailyEntry[]
): Array<{ date: string; value: number | null }> {
  return entries.map(entry => {
    const { value } = dailyContributionMarginMinor(entry);
    return { date: entry.entryDate, value: isCollected(value) ? value : null };
  });
}
