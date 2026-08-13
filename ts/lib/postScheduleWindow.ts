/** IANA zone treated as the posting audience's local time. */
const POSTING_TIME_ZONE = "America/Chicago";

/**
 * The 10am-2am Central window, split into 4 fixed-width buckets. Hours are
 * local-Chicago hours-of-day; the last bucket's end (26) means "2am the
 * following calendar day" so the window can be walked as a single span.
 */
const BUCKETS: ReadonlyArray<{ startHour: number; endHour: number }> = [
  { startHour: 10, endHour: 14 },
  { startHour: 14, endHour: 18 },
  { startHour: 18, endHour: 22 },
  { startHour: 22, endHour: 26 },
];

/** One randomly-drawn posting slot, as a ready-to-use GitHub Actions cron string (UTC, "M H * * *"). */
export interface ScheduledSlot {
  /** UTC cron expression for this slot, e.g. "37 18 * * *". */
  cron: string;
  /** The slot's actual UTC instant on the target calendar date, for tests/debugging. */
  utc: Date;
}

/**
 * Returns the UTC offset (in minutes, negative for zones behind UTC) that
 * `POSTING_TIME_ZONE` observes at the given instant. Implemented by
 * formatting the instant as Chicago wall-clock digits and diffing that
 * against the instant itself — the standard Intl trick for reading a zone's
 * offset without a datetime library.
 */
function chicagoOffsetMinutesAt(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: POSTING_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wallClockAsUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));

  return (wallClockAsUTC - instant.getTime()) / 60_000;
}

/**
 * Converts a Chicago wall-clock date/time to its actual UTC instant,
 * correctly reflecting whichever offset (CST/CDT) is in effect on that date.
 * Two-step fixpoint: the offset itself depends on the instant we're solving
 * for, so refine once against the first guess (over-engineering further
 * isn't worth it for a twice-a-year, one-hour-wide transition window).
 */
function chicagoWallClockToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = chicagoOffsetMinutesAt(new Date(guessUtcMs));
  const refinedUtcMs = guessUtcMs - offset * 60_000;
  const refinedOffset = chicagoOffsetMinutesAt(new Date(refinedUtcMs));
  return new Date(guessUtcMs - refinedOffset * 60_000);
}

/**
 * Draws one random UTC-cron posting slot per bucket for the Central-time
 * window belonging to `chicagoDate` (a Y-M-D anchored to the bucket's
 * *start* day — the last bucket runs past midnight into the next calendar
 * day, but still belongs to this same window).
 *
 * rng is injectable for deterministic tests; each call should draw once
 * (bucket order matches BUCKETS, so slots come back in chronological order).
 */
export function drawScheduledSlots(chicagoDate: { year: number; month: number; day: number }, rng: () => number = Math.random): ScheduledSlot[] {
  return BUCKETS.map(({ startHour, endHour }) => {
    const bucketMinutes = (endHour - startHour) * 60;
    const offsetMinutes = Math.floor(rng() * bucketMinutes);
    const totalMinutesFromStartOfDay = startHour * 60 + offsetMinutes;

    // endHour can run past 24 (the 22-26 bucket) — let Date.UTC's own
    // day-rollover handle it rather than branching on day-crossing by hand.
    const utc = chicagoWallClockToUtc(
      chicagoDate.year,
      chicagoDate.month,
      chicagoDate.day,
      0,
      totalMinutesFromStartOfDay
    );

    return {
      utc,
      cron: `${utc.getUTCMinutes()} ${utc.getUTCHours()} * * *`,
    };
  });
}

/** The Chicago calendar date (Y-M-D) that `instant` falls on, per the posting time zone. */
export function chicagoCalendarDate(instant: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: POSTING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Adds (or subtracts, with a negative count) whole calendar days to a Y-M-D date. */
export function addDays(date: { year: number; month: number; day: number }, days: number): { year: number; month: number; day: number } {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day) + days * 86_400_000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

/**
 * The calendar date that the *currently running* Central-time window is
 * anchored to — i.e. the day its 10am bucket started on. The last bucket
 * (10pm-2am) runs past Chicago midnight, so between midnight and 10am
 * Chicago the anchor is still "yesterday"; from 10am on, it's today.
 */
export function currentWindowAnchorDate(now: Date): { year: number; month: number; day: number } {
  const chicagoHour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: POSTING_TIME_ZONE, hour: "2-digit", hourCycle: "h23" })
      .formatToParts(now)
      .find((p) => p.type === "hour")?.value
  );

  const today = chicagoCalendarDate(now);
  return chicagoHour < BUCKETS[0].startHour ? addDays(today, -1) : today;
}
