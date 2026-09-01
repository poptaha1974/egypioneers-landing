import type {
  DataQualityStatus,
  Metric,
  NumericField,
  PeriodMetrics,
} from "@shared/student/metrics";
import type { MannKendall } from "@shared/student/timeseries";

export const THINC_SCHEMA_VERSION = "student-panel-1.0.0";
export const THINC_MODEL_VERSION = "v5-research-preview";

/** إعلان إلزامي في كل مخرج (مبدأ THINC رقم 3 و6). */
export const THINC_STATUS_DECLARATION =
  "Research Preview — غير متحقق ميدانياً. مخرجات THINC ليست احتمال نجاح ولا توصية مالية آلية.";

export type GateName =
  | "COMPLIANCE"
  | "LIQUIDITY"
  | "CONTRIBUTION_MARGIN"
  | "DATA_QUALITY"
  | "SAMPLE_SIZE"
  | "DELIVERED_PROFIT"
  | "EXPERIMENT_PROTOCOL"
  | "HUMAN_APPROVAL";

/** `NOT_EVALUABLE` اعتراف بغياب المُدخل — مش نجاح ومش فشل. */
export type GateStatus = "PASS" | "FAIL" | "NOT_EVALUABLE" | "NOT_EVALUATED";

export type GateResult = { gate: GateName; status: GateStatus; reason: string };

export type EngineName =
  | "MarketEngine"
  | "ProductEngine"
  | "EconomicsEngine"
  | "OfferEngine"
  | "CreativeEngine"
  | "MediaExperimentEngine"
  | "OperationsEngine"
  | "BrandEngine"
  | "FounderLearningEngine";

export type Uncertainty = "LOW" | "MEDIUM" | "HIGH";

export type EngineResult = {
  engine: EngineName;
  /** تقييم وصفي — مش درجة، ومش بيتجمع مع غيره في رقم واحد. */
  assessment: string;
  constraints: string[];
  missing: string[];
  uncertainty: Uncertainty;
  /** أقرب تجربة تقلل عدم اليقين. */
  nextExperiment: string | null;
};

export type Decision =
  "RESEARCH" | "TEST" | "FIX" | "HOLD" | "REPOSITION" | "SCALE" | "KILL";

export type RegisteredExperiment = {
  hypothesis: string;
  primaryVariable: string;
  unitOfAnalysis: string;
  successCriterion: string;
  stopLoss: string;
  registeredAt: string;
};

export type ThincInput = {
  metrics: PeriodMetrics;
  dataQuality: DataQualityStatus;
  /** عدد الأيام المرصودة في الفترة. */
  daysObserved: number;
  /** أحدث يوم فيه دليل فعلي. */
  evidenceAsOf: string | null;
  trend: MannKendall | null;
  /** null = المُدخل مش متجمّع أصلاً → البوابة NOT_EVALUABLE. */
  compliance: { blockers: string[] } | null;
  liquidity: { runwayDays: number | null } | null;
  experiment: RegisteredExperiment | null;
  humanApproval: { approvedBy: string; approvedAt: string } | null;
  /** القرار المطلوب فحصه — بيحدد البوابات المطلوبة (DELIVERED_PROFIT لـSCALE فقط). */
  requestedDecision?: Decision;
};

export type ThincResult = {
  decision: Decision;
  decisionReasons: string[];
  gates: GateResult[];
  engines: EngineResult[];
  missing: Array<{ field: NumericField | string; reason: string }>;
  dataQuality: DataQualityStatus;
  uncertainty: Uncertainty;
  schemaVersion: string;
  modelVersion: string;
  evidenceAsOf: string | null;
  generatedAt: string;
  statusDeclaration: string;
};

export type MetricLike = Metric;
