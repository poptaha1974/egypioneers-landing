import { date, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ======================================================
// Leads Table - نموذج تأهيل العملاء المحتملين
// THINC Intent Score: HOT (>70) | WARM (40-69) | COLD (<40)
// ======================================================
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: varchar("role", { length: 100 }),
  challenge: text("challenge"),
  stage: varchar("stage", { length: 100 }),
  readiness: varchar("readiness", { length: 100 }),
  preference: varchar("preference", { length: 100 }),
  intentScore: int("intentScore"),
  leadStatus: mysqlEnum("leadStatus", ["HOT", "WARM", "COLD"]).default("COLD").notNull(),
  whatsappConsent: int("whatsappConsent").default(0).notNull(),
  whatsappConsentAt: timestamp("whatsappConsentAt"),
  whatsappOptedOutAt: timestamp("whatsappOptedOutAt"),
  visitorSessionId: varchar("visitorSessionId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  visitorSessionIndex: index("leads_visitor_session_idx").on(table.visitorSessionId),
}));

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ======================================================
// Visitor Engagement - سلوك ملاحظ لا يساوي نية شراء.
// يُربط بالـLead بعد التسجيل عبر visitorSessionId عشوائي.
// ======================================================
export const visitorEngagementEvents = mysqlTable("visitorEngagementEvents", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  leadId: int("leadId"),
  eventName: mysqlEnum("eventName", [
    "section_viewed",
    "faq_opened",
    "video_started",
    "video_completed",
    "cta_clicked",
    "form_started",
  ]).notNull(),
  target: varchar("target", { length: 128 }).notNull(),
  detail: varchar("detail", { length: 255 }),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, (table) => ({
  uniqueSessionEventTarget: uniqueIndex("visitor_engagement_session_event_target_unique").on(
    table.sessionId,
    table.eventName,
    table.target,
  ),
  sessionIndex: index("visitor_engagement_session_idx").on(table.sessionId),
  leadIndex: index("visitor_engagement_lead_idx").on(table.leadId),
}));

export type VisitorEngagementEvent = typeof visitorEngagementEvents.$inferSelect;

// ======================================================
// Purchases - سجل الدفع المؤكد فقط؛ لا يُنشأ من زر أو صفحة نجاح.
// ======================================================
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 64 }).notNull(),
  providerTransactionId: varchar("providerTransactionId", { length: 255 }).notNull(),
  leadId: int("leadId"),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  amountMinor: int("amountMinor").notNull(),
  currency: varchar("currency", { length: 12 }).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["paid", "refunded", "failed"]).notNull(),
  eventId: varchar("eventId", { length: 160 }).notNull(),
  eventSourceUrl: text("eventSourceUrl"),
  capiDeliveredAt: timestamp("capiDeliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueProviderTransaction: uniqueIndex("purchases_provider_transaction_unique").on(
    table.provider,
    table.providerTransactionId,
  ),
}));

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

// ======================================================
// Webinar Message Logs - منع تكرار الرسائل قبل أي إرسال فعلي
// ======================================================
export const webinarMessageLogs = mysqlTable("webinarMessageLogs", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  messageType: mysqlEnum("messageType", ["welcome", "reminder_24h", "reminder_3h"]).notNull(),
  webinarStartAt: timestamp("webinarStartAt").notNull(),
  status: mysqlEnum("status", ["queued", "draft_received", "sent", "failed", "skipped"]).default("queued").notNull(),
  providerMessageId: varchar("providerMessageId", { length: 255 }),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueLeadMessageForWebinar: uniqueIndex("webinar_message_log_delivery_unique").on(
    table.leadId,
    table.messageType,
    table.webinarStartAt,
  ),
}));

export type WebinarMessageLog = typeof webinarMessageLogs.$inferSelect;

// ======================================================
// Students - ملف الطالب المربوط بحساب الدخول (Manus OAuth)
// الطالب يشوف بياناته هو بس؛ الشيت المجمع للإدارة فقط.
// ======================================================
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  leadId: int("leadId"),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  cohort: varchar("cohort", { length: 64 }),
  storeName: varchar("storeName", { length: 255 }),
  market: varchar("market", { length: 8 }).default("EG").notNull(),
  status: mysqlEnum("status", ["active", "paused", "graduated", "churned"]).default("active").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// ======================================================
// Student Daily Entries - إدخال يومي لكل طالب.
// THINC مبدأ 2: العمود الفاضي يفضل NULL (NOT_COLLECTED) ولا يتحول لصفر.
// كل المبالغ بالقرش (minor units) زي جدول purchases.
// ======================================================
export const studentDailyEntries = mysqlTable("studentDailyEntries", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  entryDate: date("entryDate", { mode: "string" }).notNull(),

  ordersPlaced: int("ordersPlaced"),
  ordersConfirmed: int("ordersConfirmed"),
  ordersDelivered: int("ordersDelivered"),
  ordersReturned: int("ordersReturned"),

  collectedRevenueMinor: int("collectedRevenueMinor"),
  productCostMinor: int("productCostMinor"),
  adSpendMinor: int("adSpendMinor"),
  shippingMinor: int("shippingMinor"),
  collectionFeesMinor: int("collectionFeesMinor"),
  returnCostMinor: int("returnCostMinor"),
  variableOpsMinor: int("variableOpsMinor"),

  leadsCount: int("leadsCount"),
  sessionsCount: int("sessionsCount"),

  notes: text("notes"),
  source: mysqlEnum("source", ["student", "admin", "import"]).default("student").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueStudentDate: uniqueIndex("student_daily_entry_unique").on(table.studentId, table.entryDate),
  studentDateIndex: index("student_daily_entry_student_date_idx").on(table.studentId, table.entryDate),
}));

export type StudentDailyEntry = typeof studentDailyEntries.$inferSelect;
export type InsertStudentDailyEntry = typeof studentDailyEntries.$inferInsert;

// ======================================================
// Revisions - سجل تاريخي append-only يسمح باسترجاع صورة أي يوم
// كما كانت معروفة في تاريخ معين (point-in-time recall).
// ======================================================
export const studentDailyEntryRevisions = mysqlTable("studentDailyEntryRevisions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  entryDate: date("entryDate", { mode: "string" }).notNull(),
  revision: int("revision").notNull(),
  payload: json("payload").notNull(),
  changeReason: varchar("changeReason", { length: 255 }),
  recordedByUserId: int("recordedByUserId"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, (table) => ({
  uniqueRevision: uniqueIndex("student_daily_revision_unique").on(table.studentId, table.entryDate, table.revision),
  recallIndex: index("student_daily_revision_recall_idx").on(table.studentId, table.recordedAt),
}));

export type StudentDailyEntryRevision = typeof studentDailyEntryRevisions.$inferSelect;

// ======================================================
// CRM - حالة رحلة العميل/الطالب لفريق خدمة العملاء
// ======================================================
export const crmRecords = mysqlTable("crmRecords", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId"),
  studentId: int("studentId"),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  stage: mysqlEnum("stage", [
    "new",
    "contacted",
    "qualified",
    "enrolled",
    "onboarding",
    "active",
    "at_risk",
    "recovered",
    "churned",
  ]).default("new").notNull(),
  status: mysqlEnum("status", ["open", "waiting", "closed_won", "closed_lost"]).default("open").notNull(),
  ownerUserId: int("ownerUserId"),
  nextActionAt: timestamp("nextActionAt"),
  lastContactAt: timestamp("lastContactAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueLead: uniqueIndex("crm_record_lead_unique").on(table.leadId),
  stageIndex: index("crm_record_stage_idx").on(table.stage, table.status),
}));

export type CrmRecord = typeof crmRecords.$inferSelect;
export type InsertCrmRecord = typeof crmRecords.$inferInsert;

export const crmInteractions = mysqlTable("crmInteractions", {
  id: int("id").autoincrement().primaryKey(),
  crmRecordId: int("crmRecordId").notNull(),
  channel: mysqlEnum("channel", ["whatsapp", "call", "email", "meeting", "note"]).notNull(),
  direction: mysqlEnum("direction", ["in", "out", "internal"]).default("internal").notNull(),
  summary: text("summary").notNull(),
  stageAfter: varchar("stageAfter", { length: 32 }),
  agentUserId: int("agentUserId"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  recordIndex: index("crm_interaction_record_idx").on(table.crmRecordId, table.occurredAt),
}));

export type CrmInteraction = typeof crmInteractions.$inferSelect;
export type InsertCrmInteraction = typeof crmInteractions.$inferInsert;

// ======================================================
// Sheet Sync Outbox - طابور مزامنة الشيت المجمع (الإدارة فقط)
// الكتابة غير متزامنة عشان فشل جوجل ما يوقفش إدخال الطالب.
// ======================================================
export const sheetSyncOutbox = mysqlTable("sheetSyncOutbox", {
  id: int("id").autoincrement().primaryKey(),
  tabName: varchar("tabName", { length: 64 }).notNull(),
  rowKey: varchar("rowKey", { length: 190 }).notNull(),
  payload: json("payload").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "skipped"]).default("pending").notNull(),
  attempts: int("attempts").default(0).notNull(),
  lastError: text("lastError"),
  availableAt: timestamp("availableAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dispatchIndex: index("sheet_sync_dispatch_idx").on(table.status, table.availableAt),
  rowKeyIndex: index("sheet_sync_rowkey_idx").on(table.tabName, table.rowKey),
}));

export type SheetSyncJob = typeof sheetSyncOutbox.$inferSelect;
export type InsertSheetSyncJob = typeof sheetSyncOutbox.$inferInsert;

// ======================================================
// THINC Evaluations - مخرج البوابات والمحركات بحقول الحوكمة الإلزامية
// ======================================================
export const thincEvaluations = mysqlTable("thincEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  periodStart: date("periodStart", { mode: "string" }).notNull(),
  periodEnd: date("periodEnd", { mode: "string" }).notNull(),
  decision: mysqlEnum("decision", [
    "RESEARCH",
    "TEST",
    "FIX",
    "HOLD",
    "REPOSITION",
    "SCALE",
    "KILL",
  ]).notNull(),
  gates: json("gates").notNull(),
  engines: json("engines").notNull(),
  missing: json("missing").notNull(),
  decisionReasons: json("decisionReasons").notNull(),
  schemaVersion: varchar("schemaVersion", { length: 32 }).notNull(),
  modelVersion: varchar("modelVersion", { length: 32 }).notNull(),
  evidenceAsOf: timestamp("evidenceAsOf").notNull(),
  dataQualityStatus: mysqlEnum("dataQualityStatus", ["OK", "PARTIAL", "INSUFFICIENT"]).notNull(),
  uncertainty: mysqlEnum("uncertainty", ["LOW", "MEDIUM", "HIGH"]).notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["draft", "human_reviewed"]).default("draft").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
}, (table) => ({
  studentPeriodIndex: index("thinc_eval_student_period_idx").on(table.studentId, table.periodEnd),
}));

export type ThincEvaluation = typeof thincEvaluations.$inferSelect;
export type InsertThincEvaluation = typeof thincEvaluations.$inferInsert;
