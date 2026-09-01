import { desc, eq } from "drizzle-orm";

import { thincEvaluations } from "../drizzle/schema";
import {
  contributionSeries,
  dataQualityStatus,
  periodMetrics,
  type DailyEntry,
} from "@shared/student/metrics";
import { mannKendall } from "@shared/student/timeseries";
import { evaluateThinc } from "@shared/thinc/decision";
import type {
  Decision,
  RegisteredExperiment,
  ThincInput,
  ThincResult,
} from "@shared/thinc/types";
import { buildThincRow, thincRowKey } from "@shared/sheets/tabs";
import { getDb } from "./db";
import { enqueueSheetSyncQuietly } from "./sheetSync";

export type ThincContextInput = {
  compliance?: { blockers: string[] } | null;
  liquidity?: { runwayDays: number | null } | null;
  experiment?: RegisteredExperiment | null;
  humanApproval?: { approvedBy: string; approvedAt: string } | null;
  requestedDecision?: Decision;
};

/**
 * بيغذّي نموذج THINC بأرقام الطالب الفعلية.
 * المُدخلات الغائبة بتتبعت null عن قصد عشان البوابة ترجع NOT_EVALUABLE
 * بدل ما نخترع قيمة.
 */
export function buildThincInput(
  entries: DailyEntry[],
  context: ThincContextInput = {}
): ThincInput {
  const metrics = periodMetrics(entries);
  const series = contributionSeries(entries);
  const lastWithEvidence = [...series]
    .reverse()
    .find(point => point.value !== null);

  return {
    metrics,
    dataQuality: dataQualityStatus(metrics),
    daysObserved: entries.length,
    evidenceAsOf: lastWithEvidence?.date ?? null,
    trend: mannKendall(series),
    compliance: context.compliance ?? null,
    liquidity: context.liquidity ?? null,
    experiment: context.experiment ?? null,
    humanApproval: context.humanApproval ?? null,
    ...(context.requestedDecision
      ? { requestedDecision: context.requestedDecision }
      : {}),
  };
}

export function evaluateStudentPeriod(
  entries: DailyEntry[],
  context: ThincContextInput = {},
  now = new Date()
): ThincResult {
  return evaluateThinc(buildThincInput(entries, context), now);
}

/**
 * حفظ التقييم بحقول الحوكمة الإلزامية. الحفظ لا يعني تنفيذ:
 * ولا قرار بيتحول لفعل تجاري من غير موافقة بشرية صريحة.
 */
export async function recordThincEvaluation(params: {
  studentId: number;
  periodStart: string;
  periodEnd: string;
  result: ThincResult;
}): Promise<{ id: number } | null> {
  const db = await getDb();
  if (!db) return null;

  const { result } = params;
  const failedGates = result.gates
    .filter(gate => gate.status === "FAIL")
    .map(gate => gate.gate);
  const notEvaluable = result.gates
    .filter(gate => gate.status === "NOT_EVALUABLE")
    .map(gate => gate.gate);

  const inserted = await db.insert(thincEvaluations).values({
    studentId: params.studentId,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    decision: result.decision,
    gates: result.gates,
    engines: result.engines,
    missing: result.missing,
    decisionReasons: result.decisionReasons,
    schemaVersion: result.schemaVersion,
    modelVersion: result.modelVersion,
    evidenceAsOf: result.evidenceAsOf
      ? new Date(`${result.evidenceAsOf}T00:00:00Z`)
      : new Date(result.generatedAt),
    dataQualityStatus: result.dataQuality,
    uncertainty: result.uncertainty,
  });

  const id = Number(inserted[0].insertId);

  enqueueSheetSyncQuietly({
    tab: "thinc",
    rowKey: thincRowKey(id),
    values: buildThincRow({
      id,
      studentId: params.studentId,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      decision: result.decision,
      dataQuality: result.dataQuality,
      uncertainty: result.uncertainty,
      failedGates,
      notEvaluableGates: notEvaluable,
      decisionReasons: result.decisionReasons,
      modelVersion: result.modelVersion,
      evidenceAsOf: result.evidenceAsOf,
      reviewStatus: "draft",
      generatedAt: result.generatedAt,
    }),
  });

  return { id };
}

export async function listThincEvaluations(studentId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(thincEvaluations)
    .where(eq(thincEvaluations.studentId, studentId))
    .orderBy(desc(thincEvaluations.generatedAt))
    .limit(limit);
}
