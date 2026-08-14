export const WEBINAR_TIME_ZONE = "Africa/Cairo";
export const WEBINAR_WEEKDAY = 3;
export const WEBINAR_START_HOUR = 18;
export const WEBINAR_START_MINUTE = 0;
export const OPEN_WEBINAR_MINUTES = 30;

type CairoDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
  second: number;
};

function getCairoDateParts(date: Date): CairoDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WEBINAR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const weekdayText = parts.find((part) => part.type === "weekday")?.value;
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    weekday: weekdayMap[weekdayText ?? "Sun"] ?? 0,
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function cairoOffsetMilliseconds(date: Date) {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: WEBINAR_TIME_ZONE,
    timeZoneName: "longOffset",
  }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00";
  const match = offset.match(/GMT([+-])(\d{2}):(\d{2})/);

  if (!match) return 0;
  const sign = match[1] === "+" ? 1 : -1;
  return sign * (Number(match[2]) * 60 + Number(match[3])) * 60_000;
}

function cairoLocalToUtc(year: number, month: number, day: number, hour: number, minute: number) {
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = cairoOffsetMilliseconds(new Date(localAsUtc));
  return new Date(localAsUtc - offset);
}

export function getNextWebinarStart(now = new Date()) {
  const cairoNow = getCairoDateParts(now);
  let daysUntilWednesday = (WEBINAR_WEEKDAY - cairoNow.weekday + 7) % 7;
  const hasStartedToday =
    cairoNow.weekday === WEBINAR_WEEKDAY &&
    (cairoNow.hour > WEBINAR_START_HOUR ||
      (cairoNow.hour === WEBINAR_START_HOUR && cairoNow.minute >= WEBINAR_START_MINUTE));

  if (hasStartedToday || (daysUntilWednesday === 0 && cairoNow.hour >= WEBINAR_START_HOUR)) {
    daysUntilWednesday = 7;
  }

  const targetDate = new Date(Date.UTC(cairoNow.year, cairoNow.month - 1, cairoNow.day + daysUntilWednesday));
  return cairoLocalToUtc(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth() + 1,
    targetDate.getUTCDate(),
    WEBINAR_START_HOUR,
    WEBINAR_START_MINUTE,
  );
}

export function getCountdownParts(target: Date, now = new Date()) {
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  return {
    totalSeconds,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}
