import { isCollected } from "@shared/student/metrics";
import type { GateResult, ThincInput } from "@shared/thinc/types";

/** الحد الأدنى للأيام والأوردرات قبل ما بوابة حجم العينة تعدّي. */
export const MIN_OBSERVED_DAYS = 14;
export const MIN_DELIVERED_ORDERS = 30;
/** أقل مدى سيولة مقبول قبل أي التزام إنفاق إضافي. */
export const MIN_RUNWAY_DAYS = 30;
/** أقصى عمر للدليل قبل ما يُعتبر غير حديث لقرار SCALE. */
export const MAX_EVIDENCE_AGE_DAYS = 14;

const daysBetween = (from: string, to: Date): number | null => {
  const parsed = new Date(`${from}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((to.getTime() - parsed.getTime()) / 86_400_000);
};

/**
 * البوابات مستقلة ولا تتقاصّ: نجاح بوابة لا يعوّض فشل غيرها،
 * ومفيش درجة كلية بتتحسب منها.
 */
export function evaluateGates(
  input: ThincInput,
  now = new Date()
): GateResult[] {
  const { metrics } = input;
  const requested = input.requestedDecision;
  const gates: GateResult[] = [];

  gates.push(
    input.compliance === null
      ? {
          gate: "COMPLIANCE",
          status: "NOT_EVALUABLE",
          reason: "مفيش فحص امتثال متسجل للفترة دي",
        }
      : input.compliance.blockers.length > 0
        ? {
            gate: "COMPLIANCE",
            status: "FAIL",
            reason: `موانع مسجّلة: ${input.compliance.blockers.join("، ")}`,
          }
        : {
            gate: "COMPLIANCE",
            status: "PASS",
            reason: "مفيش موانع امتثال مسجّلة",
          }
  );

  gates.push(
    input.liquidity === null || input.liquidity.runwayDays === null
      ? {
          gate: "LIQUIDITY",
          status: "NOT_EVALUABLE",
          reason: "مدى السيولة (runway) مش متسجل",
        }
      : input.liquidity.runwayDays < MIN_RUNWAY_DAYS
        ? {
            gate: "LIQUIDITY",
            status: "FAIL",
            reason: `مدى السيولة ${input.liquidity.runwayDays} يوم أقل من الحد ${MIN_RUNWAY_DAYS} يوم`,
          }
        : {
            gate: "LIQUIDITY",
            status: "PASS",
            reason: `مدى السيولة ${input.liquidity.runwayDays} يوم`,
          }
  );

  const margin = metrics.contributionMarginMinor;
  gates.push(
    !isCollected(margin)
      ? {
          gate: "CONTRIBUTION_MARGIN",
          status: "NOT_EVALUABLE",
          reason: `ربح المساهمة غير محسوب — بنود ناقصة: ${metrics.fullyMissingFields.join("، ") || "أيام غير مكتملة"}`,
        }
      : margin > 0
        ? {
            gate: "CONTRIBUTION_MARGIN",
            status: "PASS",
            reason: `ربح مساهمة موجب للفترة`,
          }
        : {
            gate: "CONTRIBUTION_MARGIN",
            status: "FAIL",
            reason: "ربح المساهمة غير موجب للفترة",
          }
  );

  const coverage =
    metrics.daysTotal === 0 ? 0 : metrics.daysCovered / metrics.daysTotal;
  gates.push(
    input.dataQuality === "OK"
      ? {
          gate: "DATA_QUALITY",
          status: "PASS",
          reason: `${metrics.daysCovered} من ${metrics.daysTotal} يوم مكتملة اقتصادياً (${Math.round(coverage * 100)}%)`,
        }
      : {
          gate: "DATA_QUALITY",
          status: "FAIL",
          reason: `تغطية ${Math.round(coverage * 100)}% فقط — الحالة ${input.dataQuality}`,
        }
  );

  const delivered = metrics.totals.ordersDelivered.sum;
  gates.push(
    !isCollected(delivered)
      ? {
          gate: "SAMPLE_SIZE",
          status: "NOT_EVALUABLE",
          reason: "عدد الأوردرات المسلَّمة مش متسجل",
        }
      : input.daysObserved >= MIN_OBSERVED_DAYS &&
          delivered >= MIN_DELIVERED_ORDERS
        ? {
            gate: "SAMPLE_SIZE",
            status: "PASS",
            reason: `${input.daysObserved} يوم و${delivered} أوردر مسلَّم`,
          }
        : {
            gate: "SAMPLE_SIZE",
            status: "FAIL",
            reason: `محتاج ${MIN_OBSERVED_DAYS} يوم و${MIN_DELIVERED_ORDERS} أوردر مسلَّم على الأقل — عندك ${input.daysObserved} يوم و${delivered} أوردر`,
          }
  );

  // DELIVERED_PROFIT مطلوبة لـSCALE فقط (مبدأ: شروط SCALE الثلاثة).
  if (requested !== "SCALE") {
    gates.push({
      gate: "DELIVERED_PROFIT",
      status: "NOT_EVALUATED",
      reason: "غير مطلوبة لقرار غير SCALE",
    });
  } else if (!isCollected(margin)) {
    gates.push({
      gate: "DELIVERED_PROFIT",
      status: "NOT_EVALUABLE",
      reason: "ربح المساهمة المسلَّم غير محسوب",
    });
  } else {
    const age = input.evidenceAsOf
      ? daysBetween(input.evidenceAsOf, now)
      : null;
    const stale = age === null || age > MAX_EVIDENCE_AGE_DAYS;
    const stable = input.trend !== null && input.trend.trend !== "decreasing";
    gates.push(
      margin > 0 && !stale && stable
        ? {
            gate: "DELIVERED_PROFIT",
            status: "PASS",
            reason: "ربح مسلَّم موجب بدليل حديث ومن غير اتجاه هابط",
          }
        : {
            gate: "DELIVERED_PROFIT",
            status: "FAIL",
            reason: [
              margin > 0 ? null : "الربح المسلَّم غير موجب",
              stale
                ? `الدليل مش حديث (${age === null ? "بدون تاريخ" : `${age} يوم`})`
                : null,
              stable ? null : "الاتجاه هابط إحصائياً",
            ]
              .filter(Boolean)
              .join(" · "),
          }
    );
  }

  gates.push(
    input.experiment === null
      ? {
          gate: "EXPERIMENT_PROTOCOL",
          status: "NOT_EVALUABLE",
          reason: "مفيش بروتوكول تجربة مسجّل مسبقاً",
        }
      : missingProtocolFields(input.experiment).length > 0
        ? {
            gate: "EXPERIMENT_PROTOCOL",
            status: "FAIL",
            reason: `بنود ناقصة في البروتوكول: ${missingProtocolFields(input.experiment).join("، ")}`,
          }
        : {
            gate: "EXPERIMENT_PROTOCOL",
            status: "PASS",
            reason: "بروتوكول مسجّل قبل البدء ومكتمل",
          }
  );

  const needsApproval = requested === "SCALE" || requested === "KILL";
  gates.push(
    !needsApproval
      ? {
          gate: "HUMAN_APPROVAL",
          status: "NOT_EVALUATED",
          reason: "غير مطلوبة لهذا القرار",
        }
      : input.humanApproval === null
        ? {
            gate: "HUMAN_APPROVAL",
            status: "NOT_EVALUABLE",
            reason: "مفيش موافقة بشرية موقّعة مسجّلة",
          }
        : {
            gate: "HUMAN_APPROVAL",
            status: "PASS",
            reason: `موافقة ${input.humanApproval.approvedBy}`,
          }
  );

  return gates;
}

function missingProtocolFields(
  experiment: NonNullable<ThincInput["experiment"]>
): string[] {
  const required = {
    hypothesis: "الفرضية",
    primaryVariable: "المتغير الأساسي",
    unitOfAnalysis: "وحدة التحليل",
    successCriterion: "معيار النجاح",
    stopLoss: "Stop-Loss",
  } as const;

  return Object.entries(required)
    .filter(
      ([key]) => !String(experiment[key as keyof typeof required] ?? "").trim()
    )
    .map(([, label]) => label);
}

export const gateStatus = (
  gates: GateResult[],
  gate: GateResult["gate"]
): GateResult["status"] =>
  gates.find(entry => entry.gate === gate)?.status ?? "NOT_EVALUATED";
