import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createLead,
  getAllLeads,
  getLeadsByStatus,
  markLeadWhatsAppOptOut,
  queueWebinarMessageForReview,
} from "./db";
import { deliverAcademyLead } from "./academyLeadDelivery";
import { WEBINAR_MESSAGE_TYPES } from "./webinarMessageDraft";
import { createQueuedWebinarDraftHandoff } from "./webinarDraftHandoff";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Admin-only procedure: only users with role=admin can access
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const egyptianWhatsAppPhone = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .refine((value) => /^(?:\+20|20|0)1[0125]\d{8}$/.test(value), {
    message: "رقم واتساب مصري غير صحيح",
  });

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ======================================================
  // Leads Router - نموذج تأهيل العملاء المحتملين
  // ======================================================
  leads: router({
    // Public: أي حد يقدر يسجل بياناته
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(2),
          phone: egyptianWhatsAppPhone,
          email: z.string().email(),
          role: z.string().optional(),
          challenge: z.string().optional(),
          stage: z.string().optional(),
          readiness: z.string().optional(),
          preference: z.string().optional(),
          whatsappConsent: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createLead({
          name: input.name,
          phone: input.phone,
          email: input.email,
          role: input.role || null,
          challenge: input.challenge || null,
          stage: input.stage || null,
          readiness: input.readiness || null,
          preference: input.preference || null,
          whatsappConsent: input.whatsappConsent ? 1 : 0,
          whatsappConsentAt: input.whatsappConsent ? new Date() : null,
        });
        const automationDelivered = await deliverAcademyLead({
          name: input.name,
          phone: input.phone,
          email: input.email,
        });
        return { ...result, automationDelivered };
      }),

    // Admin-only: Admin فقط يشوف الـ leads
    list: adminProcedure.query(async () => {
      return getAllLeads();
    }),

    // Admin-only: فلترة بالحالة
    byStatus: adminProcedure
      .input(z.object({ status: z.enum(["HOT", "WARM", "COLD"]) }))
      .query(async ({ input }) => {
        return getLeadsByStatus(input.status);
    }),
  }),

  // Admin-only safety gate. This records queue decisions but never delivers WhatsApp messages.
  webinarMessages: router({
    queueForReview: adminProcedure
      .input(z.object({
        leadId: z.number().int().positive(),
        messageType: z.enum(WEBINAR_MESSAGE_TYPES),
        webinarStartAt: z.coerce.date(),
      }))
      .mutation(async ({ input }) => {
        const queueDecision = await queueWebinarMessageForReview(input);
        return {
          ...queueDecision,
          draftHandoff: createQueuedWebinarDraftHandoff(input, queueDecision),
        };
      }),

    recordOptOut: adminProcedure
      .input(z.object({ leadId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const updated = await markLeadWhatsAppOptOut(input.leadId);
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        }
        return { status: "recorded" as const };
      }),
  }),
});

export type AppRouter = typeof appRouter;
