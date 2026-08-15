import type { WebinarMessageType } from "./webinarMessageDraft";

export const WEBINAR_QUEUE_SKIP_REASONS = [
  "lead_not_found",
  "missing_consent",
  "opt_out_or_dnd",
  "duplicate_prevented",
] as const;

export type WebinarQueueSkipReason = (typeof WEBINAR_QUEUE_SKIP_REASONS)[number];

export function getWebinarQueueSkipReason(input: {
  leadExists: boolean;
  whatsappConsent: number;
  whatsappOptedOutAt: Date | null;
  alreadyLogged: boolean;
}): WebinarQueueSkipReason | null {
  if (!input.leadExists) return "lead_not_found";
  if (input.whatsappConsent !== 1) return "missing_consent";
  if (input.whatsappOptedOutAt) return "opt_out_or_dnd";
  if (input.alreadyLogged) return "duplicate_prevented";
  return null;
}

export type QueueWebinarMessageInput = {
  leadId: number;
  messageType: WebinarMessageType;
  webinarStartAt: Date;
};

export type QueueWebinarMessageResult =
  | { status: "queued"; messageLogId: number }
  | { status: "skipped"; reason: WebinarQueueSkipReason };
