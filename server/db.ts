import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  leads,
  InsertLead,
  Lead,
  webinarMessageLogs,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import {
  getWebinarQueueSkipReason,
  type QueueWebinarMessageInput,
  type QueueWebinarMessageResult,
} from "./webinarMessageQueue";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ======================================================
// Leads Queries - THINC Intent Scoring
// ======================================================

/**
 * حساب Intent Score بناءً على THINC Model:
 * - readiness "جاهز أبدأ دلوقتي" = 40 نقطة
 * - readiness "خلال شهر" = 20 نقطة
 * - stage "شغّال ومحتاج أطوّر" = 20 نقطة
 * - stage "بدأت بس لسه في الأول" = 15 نقطة
 * - role "صاحب مشروع" = 15 نقطة
 * - role "مسوّق" = 10 نقطة
 * - challenge filled = 5 نقطة
 */
function calculateIntentScore(data: Omit<InsertLead, 'id' | 'intentScore' | 'leadStatus' | 'createdAt'>): number {
  let score = 0;

  // Readiness weight (highest signal)
  if (data.readiness === "جاهز أبدأ دلوقتي") score += 40;
  else if (data.readiness === "خلال شهر") score += 20;
  else score += 5;

  // Stage weight
  if (data.stage === "شغّال ومحتاج أطوّر") score += 20;
  else if (data.stage === "بدأت بس لسه في الأول") score += 15;
  else score += 5;

  // Role weight
  if (data.role === "صاحب مشروع") score += 15;
  else if (data.role === "مسوّق") score += 10;
  else score += 5;

  // Challenge detail
  if (data.challenge && data.challenge.trim().length > 10) score += 5;

  return Math.min(score, 100);
}

function getLeadStatus(score: number): "HOT" | "WARM" | "COLD" {
  if (score >= 70) return "HOT";
  if (score >= 40) return "WARM";
  return "COLD";
}

export async function createLead(data: Omit<InsertLead, 'id' | 'intentScore' | 'leadStatus' | 'createdAt'>): Promise<{ id: number; intentScore: number; leadStatus: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const intentScore = calculateIntentScore(data);
  const leadStatus = getLeadStatus(intentScore);

  const result = await db.insert(leads).values({
    ...data,
    intentScore,
    leadStatus,
  });

  return { id: Number(result[0].insertId), intentScore, leadStatus };
}

export async function getAllLeads(): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLeadsByStatus(status: "HOT" | "WARM" | "COLD"): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.leadStatus, status)).orderBy(desc(leads.createdAt));
}

export async function markLeadWhatsAppOptOut(leadId: number, optedOutAt = new Date()): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(leads)
    .set({ whatsappOptedOutAt: optedOutAt })
    .where(eq(leads.id, leadId));

  return Number(result[0].affectedRows) > 0;
}

function isDuplicateMessageLogError(error: unknown): boolean {
  return error instanceof Error && /duplicate entry|webinar_message_log_delivery_unique/i.test(error.message);
}

/**
 * This is a database-only queue gate. It never invokes n8n, FunnelFast, or WhatsApp.
 * The unique DB index provides the final race-safe duplicate check.
 */
export async function queueWebinarMessageForReview(
  input: QueueWebinarMessageInput,
): Promise<QueueWebinarMessageResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const lead = (await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1))[0];
  const existingLog = lead
    ? (await db
        .select({ id: webinarMessageLogs.id })
        .from(webinarMessageLogs)
        .where(and(
          eq(webinarMessageLogs.leadId, input.leadId),
          eq(webinarMessageLogs.messageType, input.messageType),
          eq(webinarMessageLogs.webinarStartAt, input.webinarStartAt),
        ))
        .limit(1))[0]
    : undefined;

  const skipReason = getWebinarQueueSkipReason({
    leadExists: Boolean(lead),
    whatsappConsent: lead?.whatsappConsent ?? 0,
    whatsappOptedOutAt: lead?.whatsappOptedOutAt ?? null,
    alreadyLogged: Boolean(existingLog),
  });
  if (skipReason) return { status: "skipped", reason: skipReason };

  try {
    const result = await db.insert(webinarMessageLogs).values({
      leadId: input.leadId,
      messageType: input.messageType,
      webinarStartAt: input.webinarStartAt,
      status: "queued",
    });
    return { status: "queued", messageLogId: Number(result[0].insertId) };
  } catch (error) {
    if (isDuplicateMessageLogError(error)) {
      return { status: "skipped", reason: "duplicate_prevented" };
    }
    throw error;
  }
}
