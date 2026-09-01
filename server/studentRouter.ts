import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  contributionSeries,
  dataQualityStatus,
  periodMetrics,
  type DailyEntry,
} from "@shared/student/metrics";
import {
  candles,
  cumulative,
  cusum,
  ewmaControlChart,
  linearTrend,
  mannKendall,
  maxDrawdown,
  sma,
} from "@shared/student/timeseries";
import { buildStudentReport, reportToCsv } from "@shared/export/report";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  CRM_CHANNELS,
  CRM_DIRECTIONS,
  CRM_STAGES,
  CRM_STATUSES,
  crmFunnelCounts,
  listCrmInteractions,
  listCrmRecords,
  logCrmInteraction,
  upsertCrmRecord,
} from "./crmDb";
import { buildErpReport } from "./erpReports";
import { dispatchSheetSync, sheetSyncBacklog } from "./sheetSync";
import {
  EDITABLE_ENTRY_FIELDS,
  getOrCreateStudent,
  listDailyEntries,
  listEntryRevisions,
  listStudents,
  recallDailyEntriesAsOf,
  saveDailyEntry,
  updateStudentProfile,
  type StoredDailyEntry,
} from "./studentsDb";
import {
  evaluateStudentPeriod,
  listThincEvaluations,
  recordThincEvaluation,
} from "./thincService";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "التاريخ لازم يكون بصيغة YYYY-MM-DD");

/** null معناها «مش متجمّع» — والفرق بينها وبين 0 محفوظ لآخر الطريق. */
const optionalCount = z
  .number()
  .int()
  .min(0)
  .max(1_000_000)
  .nullable()
  .optional();
const optionalMinor = z
  .number()
  .int()
  .min(0)
  .max(1_000_000_000)
  .nullable()
  .optional();

const dailyValuesSchema = z.object({
  ordersPlaced: optionalCount,
  ordersConfirmed: optionalCount,
  ordersDelivered: optionalCount,
  ordersReturned: optionalCount,
  collectedRevenueMinor: optionalMinor,
  productCostMinor: optionalMinor,
  adSpendMinor: optionalMinor,
  shippingMinor: optionalMinor,
  collectionFeesMinor: optionalMinor,
  returnCostMinor: optionalMinor,
  variableOpsMinor: optionalMinor,
  leadsCount: optionalCount,
  sessionsCount: optionalCount,
});

const rangeSchema = z.object({
  from: isoDate,
  to: isoDate,
  /** استرجاع تاريخي: صورة الفترة زي ما كانت معروفة في اليوم ده. */
  asOf: isoDate.optional(),
});

const experimentSchema = z
  .object({
    hypothesis: z.string(),
    primaryVariable: z.string(),
    unitOfAnalysis: z.string(),
    successCriterion: z.string(),
    stopLoss: z.string(),
    registeredAt: z.string(),
  })
  .nullable()
  .optional();

async function requireStudent(ctx: {
  user: { id: number; name: string | null; email: string | null };
}) {
  const student = await getOrCreateStudent({
    userId: ctx.user.id,
    fullName:
      ctx.user.name?.trim() ||
      ctx.user.email?.split("@")[0] ||
      `طالب ${ctx.user.id}`,
    email: ctx.user.email,
  });
  if (!student)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "مفيش ملف طالب مربوط بالحساب ده",
    });
  return student;
}

async function loadEntries(
  studentId: number,
  input: z.infer<typeof rangeSchema>
): Promise<StoredDailyEntry[]> {
  if (input.asOf) {
    return recallDailyEntriesAsOf(
      studentId,
      input.from,
      input.to,
      new Date(`${input.asOf}T23:59:59Z`)
    );
  }
  return listDailyEntries(studentId, input.from, input.to);
}

/** كل تحليلات الشارت في مكان واحد عشان الشاشة والتصدير يقروا نفس الأرقام. */
function buildAnalytics(entries: DailyEntry[]) {
  const series = contributionSeries(entries);
  return {
    series,
    cumulative: cumulative(series),
    sma7: sma(series, 7),
    control: ewmaControlChart(series),
    cusum: cusum(series),
    candles: candles(series, 7),
    trend: linearTrend(series),
    mannKendall: mannKendall(series),
    drawdown: maxDrawdown(series),
  };
}

export const studentRouter = router({
  /** ملف الطالب — بيتعمل تلقائياً أول دخول. */
  me: protectedProcedure.query(async ({ ctx }) => requireStudent(ctx)),

  updateProfile: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(2).max(255),
        phone: z.string().max(20).nullable().optional(),
        storeName: z.string().max(255).nullable().optional(),
        cohort: z.string().max(64).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await requireStudent(ctx);
      return updateStudentProfile(student.id, {
        fullName: input.fullName,
        phone: input.phone ?? null,
        storeName: input.storeName ?? null,
        cohort: input.cohort ?? null,
      });
    }),

  /** حفظ إدخال يوم. الحقل المتساب فاضي بيتخزن null مش صفر. */
  saveDaily: protectedProcedure
    .input(
      z.object({
        entryDate: isoDate,
        values: dailyValuesSchema,
        notes: z.string().max(2000).nullable().optional(),
        changeReason: z.string().max(255).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await requireStudent(ctx);
      return saveDailyEntry({
        studentId: student.id,
        studentName: student.fullName,
        entryDate: input.entryDate,
        values: input.values,
        notes: input.notes ?? null,
        source: "student",
        recordedByUserId: ctx.user.id,
        changeReason: input.changeReason ?? null,
      });
    }),

  entries: protectedProcedure
    .input(rangeSchema)
    .query(async ({ ctx, input }) => {
      const student = await requireStudent(ctx);
      return loadEntries(student.id, input);
    }),

  /** كل اللي الداشبورد محتاجه في نداء واحد. */
  dashboard: protectedProcedure
    .input(
      rangeSchema.extend({
        experiment: experimentSchema,
        requestedDecision: z.enum(["SCALE"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const student = await requireStudent(ctx);
      const entries = await loadEntries(student.id, input);
      const metrics = periodMetrics(entries);

      return {
        student,
        range: { from: input.from, to: input.to, asOf: input.asOf ?? null },
        entries,
        metrics,
        dataQuality: dataQualityStatus(metrics),
        analytics: buildAnalytics(entries),
        thinc: evaluateStudentPeriod(entries, {
          experiment: input.experiment ?? null,
          ...(input.requestedDecision
            ? { requestedDecision: input.requestedDecision }
            : {}),
        }),
      };
    }),

  /** تقرير الطالب — نفس الشكل اللي بيتصدّر CSV وبيتطبع PDF. */
  report: protectedProcedure
    .input(rangeSchema)
    .query(async ({ ctx, input }) => {
      const student = await requireStudent(ctx);
      const entries = await loadEntries(student.id, input);
      const metrics = periodMetrics(entries);
      const thinc = evaluateStudentPeriod(entries);

      return buildStudentReport({
        studentName: student.fullName,
        storeName: student.storeName,
        periodStart: input.from,
        periodEnd: input.to,
        entries,
        metrics,
        decision: thinc.decision,
        dataQuality: thinc.dataQuality,
        asOf: input.asOf ?? null,
        generatedAt: new Date().toISOString(),
        statusDeclaration: thinc.statusDeclaration,
      });
    }),

  /** تصدير بيانات الطالب نفسه بس — مفيش أي صف لطالب تاني في الملف. */
  exportCsv: protectedProcedure
    .input(rangeSchema)
    .query(async ({ ctx, input }) => {
      const student = await requireStudent(ctx);
      const entries = await loadEntries(student.id, input);
      const metrics = periodMetrics(entries);
      const thinc = evaluateStudentPeriod(entries);

      const report = buildStudentReport({
        studentName: student.fullName,
        storeName: student.storeName,
        periodStart: input.from,
        periodEnd: input.to,
        entries,
        metrics,
        decision: thinc.decision,
        dataQuality: thinc.dataQuality,
        asOf: input.asOf ?? null,
        generatedAt: new Date().toISOString(),
        statusDeclaration: thinc.statusDeclaration,
      });

      return {
        filename: `student-${student.id}-${input.from}-to-${input.to}${input.asOf ? `-asof-${input.asOf}` : ""}.csv`,
        content: reportToCsv(report),
      };
    }),

  revisions: protectedProcedure
    .input(z.object({ entryDate: isoDate }))
    .query(async ({ ctx, input }) => {
      const student = await requireStudent(ctx);
      return listEntryRevisions(student.id, input.entryDate);
    }),

  thincHistory: protectedProcedure.query(async ({ ctx }) => {
    const student = await requireStudent(ctx);
    return listThincEvaluations(student.id);
  }),

  editableFields: protectedProcedure.query(() => EDITABLE_ENTRY_FIELDS),
});

export const crmRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          stage: z.enum(CRM_STAGES).optional(),
          status: z.enum(CRM_STATUSES).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => listCrmRecords(input)),

  interactions: adminProcedure
    .input(z.object({ crmRecordId: z.number().int().positive() }))
    .query(async ({ input }) => listCrmInteractions(input.crmRecordId)),

  create: adminProcedure
    .input(
      z.object({
        displayName: z.string().min(2).max(255),
        phone: z.string().max(20).nullable().optional(),
        leadId: z.number().int().positive().nullable().optional(),
        studentId: z.number().int().positive().nullable().optional(),
        stage: z.enum(CRM_STAGES).optional(),
      })
    )
    .mutation(async ({ input }) => upsertCrmRecord(input)),

  logInteraction: adminProcedure
    .input(
      z.object({
        crmRecordId: z.number().int().positive(),
        channel: z.enum(CRM_CHANNELS),
        direction: z.enum(CRM_DIRECTIONS).optional(),
        summary: z.string().min(1).max(2000),
        stageAfter: z.enum(CRM_STAGES).nullable().optional(),
        statusAfter: z.enum(CRM_STATUSES).nullable().optional(),
        nextActionAt: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) =>
      logCrmInteraction({
        crmRecordId: input.crmRecordId,
        channel: input.channel,
        direction: input.direction,
        summary: input.summary,
        stageAfter: input.stageAfter ?? null,
        statusAfter: input.statusAfter ?? null,
        nextActionAt: input.nextActionAt ?? undefined,
        agentUserId: ctx.user.id,
      })
    ),

  funnel: adminProcedure.query(async () => crmFunnelCounts()),
});

export const erpRouter = router({
  summary: adminProcedure
    .input(z.object({ from: isoDate, to: isoDate }))
    .query(async ({ input }) => buildErpReport(input.from, input.to)),

  roster: adminProcedure.query(async () => listStudents()),

  /**
   * تقييم THINC لطالب محدد من الإدارة.
   * الحفظ توثيق فقط — مفيش تنفيذ تجاري بيحصل من هنا (مبدأ 5).
   */
  evaluateStudent: adminProcedure
    .input(
      z.object({
        studentId: z.number().int().positive(),
        from: isoDate,
        to: isoDate,
        persist: z.boolean().default(false),
        compliance: z
          .object({ blockers: z.array(z.string()) })
          .nullable()
          .optional(),
        liquidity: z
          .object({ runwayDays: z.number().int().nullable() })
          .nullable()
          .optional(),
        experiment: experimentSchema,
        humanApproval: z
          .object({ approvedBy: z.string(), approvedAt: z.string() })
          .nullable()
          .optional(),
        requestedDecision: z.enum(["SCALE"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const entries = await listDailyEntries(
        input.studentId,
        input.from,
        input.to
      );
      const result = evaluateStudentPeriod(entries, {
        compliance: input.compliance ?? null,
        liquidity: input.liquidity ?? null,
        experiment: input.experiment ?? null,
        humanApproval: input.humanApproval ?? null,
        ...(input.requestedDecision
          ? { requestedDecision: input.requestedDecision }
          : {}),
      });

      const stored = input.persist
        ? await recordThincEvaluation({
            studentId: input.studentId,
            periodStart: input.from,
            periodEnd: input.to,
            result,
          })
        : null;

      return { result, storedId: stored?.id ?? null };
    }),
});

export const sheetsRouter = router({
  backlog: adminProcedure.query(async () => sheetSyncBacklog()),
  dispatch: adminProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(100).default(25) })
        .optional()
    )
    .mutation(async ({ input }) => dispatchSheetSync(input?.limit ?? 25)),
});
