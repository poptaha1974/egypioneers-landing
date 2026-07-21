import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, leads, InsertLead, Lead } from "../drizzle/schema";
import { ENV } from './_core/env';

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
