import { and, desc, eq, sql } from "drizzle-orm";

import { crmInteractions, crmRecords, type CrmRecord } from "../drizzle/schema";
import { buildCrmRow, crmRowKey } from "@shared/sheets/tabs";
import { CRM_STAGE_LABELS_AR, CRM_STATUS_LABELS_AR } from "@shared/crm/labels";
import { getDb } from "./db";
import { enqueueSheetSyncQuietly } from "./sheetSync";

export const CRM_STAGES = [
  "new",
  "contacted",
  "qualified",
  "enrolled",
  "onboarding",
  "active",
  "at_risk",
  "recovered",
  "churned",
] as const;

export const CRM_STATUSES = [
  "open",
  "waiting",
  "closed_won",
  "closed_lost",
] as const;
export const CRM_CHANNELS = [
  "whatsapp",
  "call",
  "email",
  "meeting",
  "note",
] as const;
export const CRM_DIRECTIONS = ["in", "out", "internal"] as const;

export type CrmStage = (typeof CRM_STAGES)[number];
export type CrmStatus = (typeof CRM_STATUSES)[number];

export { CRM_STAGE_LABELS_AR, CRM_STATUS_LABELS_AR };

const toIso = (value: Date | string | null): string | null =>
  value === null ? null : value instanceof Date ? value.toISOString() : value;

export type CrmRecordWithCount = CrmRecord & { interactionsCount: number };

export async function listCrmRecords(filter?: {
  stage?: CrmStage;
  status?: CrmStatus;
}): Promise<CrmRecordWithCount[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    ...(filter?.stage ? [eq(crmRecords.stage, filter.stage)] : []),
    ...(filter?.status ? [eq(crmRecords.status, filter.status)] : []),
  ];

  const base = db
    .select({
      record: crmRecords,
      interactionsCount: sql<number>`(select count(*) from ${crmInteractions} where ${crmInteractions.crmRecordId} = ${crmRecords.id})`,
    })
    .from(crmRecords);

  const rows = await (
    conditions.length > 0 ? base.where(and(...conditions)) : base
  ).orderBy(desc(crmRecords.updatedAt));

  return rows.map(row => ({
    ...row.record,
    interactionsCount: Number(row.interactionsCount),
  }));
}

export async function getCrmRecord(
  recordId: number
): Promise<CrmRecord | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(crmRecords)
    .where(eq(crmRecords.id, recordId))
    .limit(1);
  return rows[0];
}

export async function upsertCrmRecord(input: {
  leadId?: number | null;
  studentId?: number | null;
  displayName: string;
  phone?: string | null;
  stage?: CrmStage;
  status?: CrmStatus;
  ownerUserId?: number | null;
  nextActionAt?: Date | null;
}): Promise<CrmRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (input.leadId) {
    const existing = await db
      .select()
      .from(crmRecords)
      .where(eq(crmRecords.leadId, input.leadId))
      .limit(1);
    if (existing[0]) return existing[0];
  }

  await db.insert(crmRecords).values({
    leadId: input.leadId ?? null,
    studentId: input.studentId ?? null,
    displayName: input.displayName,
    phone: input.phone ?? null,
    stage: input.stage ?? "new",
    status: input.status ?? "open",
    ownerUserId: input.ownerUserId ?? null,
    nextActionAt: input.nextActionAt ?? null,
  });

  const rows = await db
    .select()
    .from(crmRecords)
    .orderBy(desc(crmRecords.id))
    .limit(1);
  const created = rows[0];
  await syncCrmRecordToSheet(created.id);
  return created;
}

/** تسجيل تفاعل + تحديث حالة الرحلة في نفس العملية عشان الاتنين ما يتفرقوش. */
export async function logCrmInteraction(input: {
  crmRecordId: number;
  channel: (typeof CRM_CHANNELS)[number];
  direction?: (typeof CRM_DIRECTIONS)[number];
  summary: string;
  stageAfter?: CrmStage | null;
  statusAfter?: CrmStatus | null;
  nextActionAt?: Date | null;
  agentUserId?: number | null;
  occurredAt?: Date;
}): Promise<{ interactionId: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const occurredAt = input.occurredAt ?? new Date();

  const result = await db.insert(crmInteractions).values({
    crmRecordId: input.crmRecordId,
    channel: input.channel,
    direction: input.direction ?? "internal",
    summary: input.summary,
    stageAfter: input.stageAfter ?? null,
    agentUserId: input.agentUserId ?? null,
    occurredAt,
  });

  await db
    .update(crmRecords)
    .set({
      ...(input.stageAfter ? { stage: input.stageAfter } : {}),
      ...(input.statusAfter ? { status: input.statusAfter } : {}),
      ...(input.nextActionAt !== undefined
        ? { nextActionAt: input.nextActionAt }
        : {}),
      lastContactAt: occurredAt,
    })
    .where(eq(crmRecords.id, input.crmRecordId));

  await syncCrmRecordToSheet(input.crmRecordId);

  return { interactionId: Number(result[0].insertId) };
}

export async function listCrmInteractions(crmRecordId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(crmInteractions)
    .where(eq(crmInteractions.crmRecordId, crmRecordId))
    .orderBy(desc(crmInteractions.occurredAt));
}

export async function crmFunnelCounts(): Promise<
  Array<{ stage: CrmStage; count: number }>
> {
  const db = await getDb();
  if (!db) return CRM_STAGES.map(stage => ({ stage, count: 0 }));

  const rows = await db
    .select({ stage: crmRecords.stage, count: sql<number>`count(*)` })
    .from(crmRecords)
    .groupBy(crmRecords.stage);

  const counts = new Map(
    rows.map(row => [row.stage as CrmStage, Number(row.count)])
  );
  return CRM_STAGES.map(stage => ({ stage, count: counts.get(stage) ?? 0 }));
}

async function syncCrmRecordToSheet(recordId: number): Promise<void> {
  const record = await getCrmRecord(recordId);
  if (!record) return;

  const interactions = await listCrmInteractions(recordId);

  enqueueSheetSyncQuietly({
    tab: "crm",
    rowKey: crmRowKey(record.id),
    values: buildCrmRow({
      id: record.id,
      displayName: record.displayName,
      phone: record.phone,
      stage: record.stage,
      status: record.status,
      ownerName:
        record.ownerUserId === null ? null : String(record.ownerUserId),
      lastContactAt: toIso(record.lastContactAt),
      nextActionAt: toIso(record.nextActionAt),
      interactionsCount: interactions.length,
      updatedAt: toIso(record.updatedAt) ?? "",
    }),
  });
}
