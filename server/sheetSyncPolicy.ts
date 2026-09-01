/** سياسة إعادة المحاولة لطابور مزامنة الشيت — منطق خالص قابل للاختبار. */

export const MAX_SHEET_SYNC_ATTEMPTS = 5;
const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 30 * 60_000;

/** تأخير أسي: 30ث ثم دقيقة ثم دقيقتين… بحد أقصى نص ساعة. */
export function nextAttemptDelayMs(attempts: number): number {
  const exponent = Math.max(0, attempts - 1);
  return Math.min(BASE_DELAY_MS * 2 ** exponent, MAX_DELAY_MS);
}

export const shouldGiveUp = (attempts: number): boolean =>
  attempts >= MAX_SHEET_SYNC_ATTEMPTS;

export type SyncOutcome =
  | { status: "sent" }
  | { status: "failed"; error: string }
  | { status: "pending"; availableAt: Date; error: string }
  | { status: "skipped"; error: string };

/** بيقرر مصير الجوب بعد محاولة فاشلة: يعيد الجدولة ولا يستسلم. */
export function outcomeAfterFailure(
  attempts: number,
  error: string,
  now = new Date()
): SyncOutcome {
  if (shouldGiveUp(attempts)) return { status: "failed", error };
  return {
    status: "pending",
    availableAt: new Date(now.getTime() + nextAttemptDelayMs(attempts)),
    error,
  };
}
