import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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
