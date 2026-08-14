import { describe, expect, it } from "vitest";
import { getCountdownParts, getNextWebinarStart, WEBINAR_START_HOUR, WEBINAR_START_MINUTE } from "../client/src/lib/webinarSchedule";

describe("موعد الويبنار الأسبوعي", () => {
  it("يحدد الأربعاء القادم الساعة 6:00 مساءً بتوقيت القاهرة", () => {
    const target = getNextWebinarStart(new Date("2026-08-10T09:00:00.000Z"));
    const cairo = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(target);

    expect(cairo.find((part) => part.type === "weekday")?.value).toBe("Wed");
    expect(Number(cairo.find((part) => part.type === "hour")?.value)).toBe(WEBINAR_START_HOUR);
    expect(Number(cairo.find((part) => part.type === "minute")?.value)).toBe(WEBINAR_START_MINUTE);
  });

  it("يحسب أجزاء العداد بدقة", () => {
    const now = new Date("2026-08-10T00:00:00.000Z");
    const target = new Date("2026-08-11T01:02:03.000Z");
    expect(getCountdownParts(target, now)).toMatchObject({ days: 1, hours: 1, minutes: 2, seconds: 3 });
  });
});
