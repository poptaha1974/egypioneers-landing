import { dataQualityStatus, isCollected } from "@shared/student/metrics";
import { evaluateGates, gateStatus } from "@shared/thinc/gates";
import { runEngines } from "@shared/thinc/engines";
import {
  THINC_MODEL_VERSION,
  THINC_SCHEMA_VERSION,
  THINC_STATUS_DECLARATION,
  type Decision,
  type GateResult,
  type ThincInput,
  type ThincResult,
  type Uncertainty,
} from "@shared/thinc/types";

/**
 * القرارات السبعة المسموحة فقط. مفيش قرار تامن، ومفيش درجة كلية
 * تسمح لبُعد قوي إنه يعوّض فشل بوابة.
 */
export const ALLOWED_DECISIONS: Decision[] = [
  "RESEARCH",
  "TEST",
  "FIX",
  "HOLD",
  "REPOSITION",
  "SCALE",
  "KILL",
];

export const DECISION_LABELS_AR: Record<Decision, string> = {
  RESEARCH: "ابحث",
  TEST: "اختبر",
  FIX: "أصلح",
  HOLD: "أوقف مؤقتاً",
  REPOSITION: "أعد التموضع",
  SCALE: "وسّع",
  KILL: "أوقف نهائياً",
};

export function evaluateThinc(
  input: ThincInput,
  now = new Date()
): ThincResult {
  const gates = evaluateGates(input, now);
  const engines = runEngines(input);
  const { decision, reasons } = decide(input, gates);

  const missing = [
    ...input.metrics.fullyMissingFields.map(field => ({
      field,
      reason: "مفيش ولا يوم مسجّل فيه القيمة دي",
    })),
    ...gates
      .filter(gate => gate.status === "NOT_EVALUABLE")
      .map(gate => ({ field: gate.gate, reason: gate.reason })),
  ];

  return {
    decision,
    decisionReasons: reasons,
    gates,
    engines,
    missing,
    dataQuality: input.dataQuality,
    uncertainty: overallUncertainty(engines.map(engine => engine.uncertainty)),
    schemaVersion: THINC_SCHEMA_VERSION,
    modelVersion: THINC_MODEL_VERSION,
    evidenceAsOf: input.evidenceAsOf,
    generatedAt: now.toISOString(),
    statusDeclaration: THINC_STATUS_DECLARATION,
  };
}

function decide(
  input: ThincInput,
  gates: GateResult[]
): { decision: Decision; reasons: string[] } {
  const reasons: string[] = [];
  const status = (gate: GateResult["gate"]) => gateStatus(gates, gate);
  const reasonOf = (gate: GateResult["gate"]) =>
    gates.find(entry => entry.gate === gate)?.reason ?? "";

  // 1. مانع خارجي: مفيش قرار تجاري قبل ما يترفع.
  if (status("COMPLIANCE") === "FAIL") {
    return {
      decision: "HOLD",
      reasons: [`بوابة الامتثال ساقطة: ${reasonOf("COMPLIANCE")}`],
    };
  }
  if (status("LIQUIDITY") === "FAIL") {
    return {
      decision: "HOLD",
      reasons: [`بوابة السيولة ساقطة: ${reasonOf("LIQUIDITY")}`],
    };
  }

  // 2. من غير بيانات كافية مفيش استنتاج — البحث مش فشل، هو اعتراف.
  if (status("CONTRIBUTION_MARGIN") === "NOT_EVALUABLE") {
    return {
      decision: "RESEARCH",
      reasons: [
        `ربح المساهمة غير قابل للتقييم: ${reasonOf("CONTRIBUTION_MARGIN")}`,
      ],
    };
  }
  if (status("DATA_QUALITY") === "FAIL") {
    reasons.push(`جودة البيانات: ${reasonOf("DATA_QUALITY")}`);
    return { decision: "RESEARCH", reasons };
  }

  const margin = input.metrics.contributionMarginMinor;
  const marginPositive = isCollected(margin) && margin > 0;
  const operationalDefect = hasOperationalDefect(input);
  const sampleSufficient = status("SAMPLE_SIZE") === "PASS";
  const trendDown = input.trend?.trend === "decreasing";

  // 3. ربح غير موجب.
  if (!marginPositive) {
    if (operationalDefect) {
      return {
        decision: "FIX",
        reasons: [
          `ربح المساهمة غير موجب مع خلل تشغيلي محدد: ${operationalDefect}`,
        ],
      };
    }
    if (sampleSufficient && trendDown) {
      return {
        decision: "KILL",
        reasons: [
          "ربح المساهمة غير موجب على عينة كافية واتجاه هابط دال إحصائياً",
        ],
      };
    }
    if (sampleSufficient) {
      return {
        decision: "REPOSITION",
        reasons: [
          "ربح المساهمة غير موجب على عينة كافية من غير خلل تشغيلي واضح — العرض أو الجمهور محل الشك",
        ],
      };
    }
    return {
      decision: "TEST",
      reasons: [
        `ربح المساهمة غير موجب لكن العينة لسه صغيرة: ${reasonOf("SAMPLE_SIZE")}`,
      ],
    };
  }

  // 4. ربح موجب: خلل تشغيلي بيتصلح قبل أي توسع.
  if (operationalDefect) {
    return {
      decision: "FIX",
      reasons: [`ربح موجب لكن فيه خلل تشغيلي يستنزفه: ${operationalDefect}`],
    };
  }

  // 5. SCALE بشروطه الثلاثة معاً — غياب أي واحد يخرج القرار من SCALE.
  if (input.requestedDecision === "SCALE") {
    const blockers = [
      status("DELIVERED_PROFIT") === "PASS"
        ? null
        : `الربح المسلَّم: ${reasonOf("DELIVERED_PROFIT")}`,
      status("SAMPLE_SIZE") === "PASS"
        ? null
        : `حجم العينة: ${reasonOf("SAMPLE_SIZE")}`,
      status("EXPERIMENT_PROTOCOL") === "PASS"
        ? null
        : `بروتوكول التجربة: ${reasonOf("EXPERIMENT_PROTOCOL")}`,
      status("HUMAN_APPROVAL") === "PASS"
        ? null
        : `الموافقة البشرية: ${reasonOf("HUMAN_APPROVAL")}`,
    ].filter((entry): entry is string => entry !== null);

    if (blockers.length === 0) {
      return {
        decision: "SCALE",
        reasons: [
          "ربح مسلَّم موجب بدليل حديث، عينة كافية، بروتوكول مسجّل، وموافقة بشرية",
        ],
      };
    }
    return {
      decision: "TEST",
      reasons: ["SCALE مرفوض — الشروط دي ناقصة:", ...blockers],
    };
  }

  // 6. ربح موجب من غير طلب توسع: نكمل اختبار منضبط.
  return {
    decision: "TEST",
    reasons: [
      "ربح مساهمة موجب من غير خلل تشغيلي — استمرار الاختبار المنضبط هو الخطوة",
      status("EXPERIMENT_PROTOCOL") === "PASS"
        ? "البروتوكول مسجّل"
        : `سجّل البروتوكول قبل التجربة الجاية: ${reasonOf("EXPERIMENT_PROTOCOL")}`,
    ],
  };
}

function hasOperationalDefect(input: ThincInput): string | null {
  const operations = runEngines(input).find(
    engine => engine.engine === "OperationsEngine"
  );
  if (!operations || operations.constraints.length === 0) return null;
  return operations.constraints.join(" · ");
}

function overallUncertainty(values: Uncertainty[]): Uncertainty {
  if (values.includes("HIGH")) return "HIGH";
  if (values.includes("MEDIUM")) return "MEDIUM";
  return "LOW";
}

export { dataQualityStatus };
