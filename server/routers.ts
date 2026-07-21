import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createLead, getAllLeads, getLeadsByStatus } from "./db";
import { z } from "zod";

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
          phone: z.string().min(10),
          email: z.string().email(),
          role: z.string().optional(),
          challenge: z.string().optional(),
          stage: z.string().optional(),
          readiness: z.string().optional(),
          preference: z.string().optional(),
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
        });
        return result;
      }),

    // Protected: Admin فقط يشوف الـ leads
    list: protectedProcedure.query(async () => {
      return getAllLeads();
    }),

    // Protected: فلترة بالحالة
    byStatus: protectedProcedure
      .input(z.object({ status: z.enum(["HOT", "WARM", "COLD"]) }))
      .query(async ({ input }) => {
        return getLeadsByStatus(input.status);
      }),
  }),
});

export type AppRouter = typeof appRouter;
