import { describe, expect, it } from "vitest";

import {
  MAX_SHEET_SYNC_ATTEMPTS,
  nextAttemptDelayMs,
  outcomeAfterFailure,
  shouldGiveUp,
} from "./sheetSyncPolicy";

describe("سياسة مزامنة الشيت", () => {
  it("التأخير بيتضاعف وبيقف عند نص ساعة", () => {
    expect(nextAttemptDelayMs(1)).toBe(30_000);
    expect(nextAttemptDelayMs(2)).toBe(60_000);
    expect(nextAttemptDelayMs(3)).toBe(120_000);
    expect(nextAttemptDelayMs(20)).toBe(30 * 60_000);
  });

  it("بيستسلم بعد الحد الأقصى للمحاولات", () => {
    expect(shouldGiveUp(MAX_SHEET_SYNC_ATTEMPTS - 1)).toBe(false);
    expect(shouldGiveUp(MAX_SHEET_SYNC_ATTEMPTS)).toBe(true);
  });

  it("بيعيد الجدولة قبل الحد وبيفشل بعده", () => {
    const now = new Date("2026-08-20T10:00:00Z");
    const retry = outcomeAfterFailure(1, "429", now);
    expect(retry.status).toBe("pending");
    if (retry.status === "pending") {
      expect(retry.availableAt.toISOString()).toBe("2026-08-20T10:00:30.000Z");
    }
    expect(
      outcomeAfterFailure(MAX_SHEET_SYNC_ATTEMPTS, "500", now).status
    ).toBe("failed");
  });
});
