import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";

import {
  students,
  studentDailyEntries,
  studentDailyEntryRevisions,
  type InsertStudentDailyEntry,
  type Student,
} from "../drizzle/schema";
import {
  dailyContributionMarginMinor,
  isCollected,
  type DailyEntry,
} from "@shared/student/metrics";
import {
  buildDailyEntryRow,
  buildStudentRow,
  dailyEntryRowKey,
  studentRowKey,
} from "@shared/sheets/tabs";
import { getDb } from "./db";
import { enqueueSheetSyncQuietly } from "./sheetSync";

/** الأعمدة الرقمية اللي بيقدر الطالب يدخلها — أي حقل غايب بيفضل null. */
export const EDITABLE_ENTRY_FIELDS = [
  "ordersPlaced",
  "ordersConfirmed",
  "ordersDelivered",
  "ordersReturned",
  "collectedRevenueMinor",
  "productCostMinor",
  "adSpendMinor",
  "shippingMinor",
  "collectionFeesMinor",
  "returnCostMinor",
  "variableOpsMinor",
  "leadsCount",
  "sessionsCount",
] as const;

export type EditableEntryField = (typeof EDITABLE_ENTRY_FIELDS)[number];
export type DailyEntryValues = Partial<
  Record<EditableEntryField, number | null>
>;

export type StudentProfileInput = {
  userId: number;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  cohort?: string | null;
  storeName?: string | null;
};

export async function getStudentByUserId(
  userId: number
): Promise<Student | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1);
  return rows[0];
}

export async function getStudentById(
  studentId: number
): Promise<Student | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  return rows[0];
}

/** بينشئ ملف الطالب أول مرة يدخل الداشبورد، ومش بيدوس على بيانات موجودة. */
export async function getOrCreateStudent(
  input: StudentProfileInput
): Promise<Student> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getStudentByUserId(input.userId);
  if (existing) return existing;

  await db.insert(students).values({
    userId: input.userId,
    fullName: input.fullName,
    email: input.email ?? null,
    phone: input.phone ?? null,
    cohort: input.cohort ?? null,
    storeName: input.storeName ?? null,
  });

  const created = await getStudentByUserId(input.userId);
  if (!created) throw new Error("Failed to create student profile");

  syncStudentToSheet(created);
  return created;
}

export async function updateStudentProfile(
  studentId: number,
  patch: Pick<
    StudentProfileInput,
    "fullName" | "phone" | "storeName" | "cohort"
  >
): Promise<Student | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(students)
    .set({
      ...(patch.fullName ? { fullName: patch.fullName } : {}),
      phone: patch.phone ?? null,
      storeName: patch.storeName ?? null,
      cohort: patch.cohort ?? null,
    })
    .where(eq(students.id, studentId));

  const updated = await getStudentById(studentId);
  if (updated) syncStudentToSheet(updated);
  return updated;
}

export async function listStudents(): Promise<Student[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(students).orderBy(desc(students.createdAt));
}

const toIso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

function syncStudentToSheet(student: Student): void {
  enqueueSheetSyncQuietly({
    tab: "students",
    rowKey: studentRowKey(student.id),
    values: buildStudentRow({
      id: student.id,
      fullName: student.fullName,
      phone: student.phone,
      email: student.email,
      cohort: student.cohort,
      storeName: student.storeName,
      market: student.market,
      status: student.status,
      joinedAt: toIso(student.joinedAt),
      updatedAt: toIso(student.updatedAt),
    }),
  });
}

export type StoredDailyEntry = DailyEntry & {
  source: string;
  notes: string | null;
  updatedAt: string;
};

const rowToEntry = (
  row: typeof studentDailyEntries.$inferSelect
): StoredDailyEntry => ({
  entryDate: row.entryDate,
  ordersPlaced: row.ordersPlaced,
  ordersConfirmed: row.ordersConfirmed,
  ordersDelivered: row.ordersDelivered,
  ordersReturned: row.ordersReturned,
  collectedRevenueMinor: row.collectedRevenueMinor,
  productCostMinor: row.productCostMinor,
  adSpendMinor: row.adSpendMinor,
  shippingMinor: row.shippingMinor,
  collectionFeesMinor: row.collectionFeesMinor,
  returnCostMinor: row.returnCostMinor,
  variableOpsMinor: row.variableOpsMinor,
  leadsCount: row.leadsCount,
  sessionsCount: row.sessionsCount,
  source: row.source,
  notes: row.notes,
  updatedAt: toIso(row.updatedAt),
});

/**
 * حفظ إدخال يوم واحد.
 * كل حفظ بيضيف نسخة جديدة في سجل المراجعات (append-only) عشان
 * نقدر نرجّع صورة أي يوم زي ما كانت معروفة في تاريخ سابق.
 */
export async function saveDailyEntry(params: {
  studentId: number;
  studentName: string;
  entryDate: string;
  values: DailyEntryValues;
  notes?: string | null;
  source?: "student" | "admin" | "import";
  recordedByUserId?: number | null;
  changeReason?: string | null;
}): Promise<StoredDailyEntry> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const payload: InsertStudentDailyEntry = {
    studentId: params.studentId,
    entryDate: params.entryDate,
    notes: params.notes ?? null,
    source: params.source ?? "student",
  };

  for (const field of EDITABLE_ENTRY_FIELDS) {
    payload[field] = params.values[field] ?? null;
  }

  const updateSet = Object.fromEntries(
    [...EDITABLE_ENTRY_FIELDS, "notes", "source"].map(field => [
      field,
      payload[field as keyof InsertStudentDailyEntry],
    ])
  );

  await db
    .insert(studentDailyEntries)
    .values(payload)
    .onDuplicateKeyUpdate({ set: updateSet });

  const stored = await getDailyEntry(params.studentId, params.entryDate);
  if (!stored) throw new Error("Failed to persist daily entry");

  const [{ maxRevision }] = await db
    .select({
      maxRevision: sql<
        number | null
      >`max(${studentDailyEntryRevisions.revision})`,
    })
    .from(studentDailyEntryRevisions)
    .where(
      and(
        eq(studentDailyEntryRevisions.studentId, params.studentId),
        eq(studentDailyEntryRevisions.entryDate, params.entryDate)
      )
    );

  await db.insert(studentDailyEntryRevisions).values({
    studentId: params.studentId,
    entryDate: params.entryDate,
    revision: (maxRevision ?? 0) + 1,
    payload: stored,
    changeReason: params.changeReason ?? null,
    recordedByUserId: params.recordedByUserId ?? null,
  });

  const margin = dailyContributionMarginMinor(stored).value;
  enqueueSheetSyncQuietly({
    tab: "dailyEntries",
    rowKey: dailyEntryRowKey(params.studentId, params.entryDate),
    values: buildDailyEntryRow({
      studentId: params.studentId,
      studentName: params.studentName,
      entryDate: params.entryDate,
      ordersPlaced: stored.ordersPlaced,
      ordersConfirmed: stored.ordersConfirmed,
      ordersDelivered: stored.ordersDelivered,
      ordersReturned: stored.ordersReturned,
      collectedRevenueMinor: stored.collectedRevenueMinor,
      productCostMinor: stored.productCostMinor,
      adSpendMinor: stored.adSpendMinor,
      shippingMinor: stored.shippingMinor,
      collectionFeesMinor: stored.collectionFeesMinor,
      returnCostMinor: stored.returnCostMinor,
      variableOpsMinor: stored.variableOpsMinor,
      leadsCount: stored.leadsCount,
      sessionsCount: stored.sessionsCount,
      contributionMarginMinor: isCollected(margin) ? margin : null,
      source: stored.source,
      notes: stored.notes,
      updatedAt: stored.updatedAt,
    }),
  });

  return stored;
}

export async function getDailyEntry(
  studentId: number,
  entryDate: string
): Promise<StoredDailyEntry | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(studentDailyEntries)
    .where(
      and(
        eq(studentDailyEntries.studentId, studentId),
        eq(studentDailyEntries.entryDate, entryDate)
      )
    )
    .limit(1);
  return rows[0] ? rowToEntry(rows[0]) : undefined;
}

export async function listDailyEntries(
  studentId: number,
  from: string,
  to: string
): Promise<StoredDailyEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(studentDailyEntries)
    .where(
      and(
        eq(studentDailyEntries.studentId, studentId),
        gte(studentDailyEntries.entryDate, from),
        lte(studentDailyEntries.entryDate, to)
      )
    )
    .orderBy(asc(studentDailyEntries.entryDate));
  return rows.map(rowToEntry);
}

/**
 * استرجاع تاريخي: صورة الفترة زي ما كانت معروفة في `asOf`.
 * أي تعديل اتعمل بعد التاريخ ده ما بيظهرش — ده اللي بيخلي المقارنة
 * بين «اللي كنا شايفينه وقتها» و«اللي طلع بعدين» ممكنة.
 */
export async function recallDailyEntriesAsOf(
  studentId: number,
  from: string,
  to: string,
  asOf: Date
): Promise<StoredDailyEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(studentDailyEntryRevisions)
    .where(
      and(
        eq(studentDailyEntryRevisions.studentId, studentId),
        gte(studentDailyEntryRevisions.entryDate, from),
        lte(studentDailyEntryRevisions.entryDate, to),
        lte(studentDailyEntryRevisions.recordedAt, asOf)
      )
    )
    .orderBy(
      asc(studentDailyEntryRevisions.entryDate),
      asc(studentDailyEntryRevisions.revision)
    );

  const latestByDate = new Map<string, StoredDailyEntry>();
  for (const row of rows) {
    latestByDate.set(row.entryDate, row.payload as StoredDailyEntry);
  }

  return Array.from(latestByDate.values()).sort((a, b) =>
    a.entryDate.localeCompare(b.entryDate)
  );
}

export async function listEntryRevisions(studentId: number, entryDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(studentDailyEntryRevisions)
    .where(
      and(
        eq(studentDailyEntryRevisions.studentId, studentId),
        eq(studentDailyEntryRevisions.entryDate, entryDate)
      )
    )
    .orderBy(desc(studentDailyEntryRevisions.revision));
}
