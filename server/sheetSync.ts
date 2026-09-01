import { and, asc, eq, lte } from "drizzle-orm";

import { sheetSyncOutbox } from "../drizzle/schema";
import {
  SHEET_HEADERS,
  SHEET_TABS,
  type SheetTabKey,
} from "@shared/sheets/tabs";
import { getDb } from "./db";
import { getSheetsConfig, upsertRow } from "./googleSheets";
import { outcomeAfterFailure } from "./sheetSyncPolicy";

/**
 * طابور الكتابة على الشيت المجمع.
 *
 * الكتابة بتتأجل عن قصد: لو جوجل وقع أو الاعتماد ناقص، إدخال الطالب
 * بيكمل عادي والصف بيفضل في الطابور. الشيت مرآة للإدارة، مش مصدر الحقيقة.
 */

export type SheetSyncJobInput = {
  tab: SheetTabKey;
  rowKey: string;
  values: Array<string | number>;
};

export async function enqueueSheetSync(
  job: SheetSyncJobInput
): Promise<{ queued: boolean }> {
  const db = await getDb();
  if (!db) return { queued: false };

  await db.insert(sheetSyncOutbox).values({
    tabName: SHEET_TABS[job.tab],
    rowKey: job.rowKey,
    payload: { tab: job.tab, values: job.values },
  });

  return { queued: true };
}

/** نداء «أطلق وانسَ» — أي فشل في الطابور ما يوقفش طلب المستخدم. */
export function enqueueSheetSyncQuietly(job: SheetSyncJobInput): void {
  void enqueueSheetSync(job).catch(error => {
    console.warn("[SheetSync] enqueue failed:", error);
  });
}

export type DispatchSummary = {
  processed: number;
  sent: number;
  retried: number;
  failed: number;
  skipped: number;
  reason?: string;
};

/**
 * بيصرف الجوبات المستحقة. آمن للتكرار: كل صف بيتكتب upsert بمفتاحه،
 * فإعادة إرسال نفس الجوب ما بتضاعفش صفوف في الشيت.
 */
export async function dispatchSheetSync(
  limit = 25,
  now = new Date()
): Promise<DispatchSummary> {
  const summary: DispatchSummary = {
    processed: 0,
    sent: 0,
    retried: 0,
    failed: 0,
    skipped: 0,
  };

  const db = await getDb();
  if (!db) return { ...summary, reason: "database_unavailable" };

  const config = getSheetsConfig();
  if (!config) return { ...summary, reason: "sheets_credentials_missing" };

  const jobs = await db
    .select()
    .from(sheetSyncOutbox)
    .where(
      and(
        eq(sheetSyncOutbox.status, "pending"),
        lte(sheetSyncOutbox.availableAt, now)
      )
    )
    .orderBy(asc(sheetSyncOutbox.availableAt))
    .limit(limit);

  for (const job of jobs) {
    summary.processed += 1;
    const attempts = job.attempts + 1;
    const payload = job.payload as {
      tab: SheetTabKey;
      values: Array<string | number>;
    };
    const headers = SHEET_HEADERS[payload.tab];

    if (!headers) {
      await db
        .update(sheetSyncOutbox)
        .set({
          status: "skipped",
          attempts,
          lastError: `unknown tab: ${payload.tab}`,
        })
        .where(eq(sheetSyncOutbox.id, job.id));
      summary.skipped += 1;
      continue;
    }

    try {
      await upsertRow(config, job.tabName, headers, job.rowKey, payload.values);
      await db
        .update(sheetSyncOutbox)
        .set({ status: "sent", attempts, sentAt: new Date(), lastError: null })
        .where(eq(sheetSyncOutbox.id, job.id));
      summary.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const outcome = outcomeAfterFailure(attempts, message, now);

      if (outcome.status === "pending") {
        await db
          .update(sheetSyncOutbox)
          .set({
            attempts,
            lastError: outcome.error,
            availableAt: outcome.availableAt,
          })
          .where(eq(sheetSyncOutbox.id, job.id));
        summary.retried += 1;
      } else {
        await db
          .update(sheetSyncOutbox)
          .set({ status: "failed", attempts, lastError: message })
          .where(eq(sheetSyncOutbox.id, job.id));
        summary.failed += 1;
      }
    }
  }

  return summary;
}

export async function sheetSyncBacklog(): Promise<{
  pending: number;
  failed: number;
  configured: boolean;
}> {
  const db = await getDb();
  if (!db)
    return { pending: 0, failed: 0, configured: getSheetsConfig() !== null };

  const rows = await db
    .select({ status: sheetSyncOutbox.status })
    .from(sheetSyncOutbox);
  return {
    pending: rows.filter(row => row.status === "pending").length,
    failed: rows.filter(row => row.status === "failed").length,
    configured: getSheetsConfig() !== null,
  };
}
