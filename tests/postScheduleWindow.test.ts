import { describe, expect, test } from "bun:test";

import { addDays, chicagoCalendarDate, currentWindowAnchorDate, drawScheduledSlots } from "../ts/lib/postScheduleWindow";

describe("drawScheduledSlots", () => {
  test("converts the first bucket's start (10am Chicago) to UTC correctly in winter (CST, UTC-6)", () => {
    const slots = drawScheduledSlots({ year: 2026, month: 1, day: 15 }, () => 0);
    expect(slots[0].cron).toBe("0 16 * * *");
  });

  test("converts the first bucket's start (10am Chicago) to UTC correctly in summer (CDT, UTC-5)", () => {
    const slots = drawScheduledSlots({ year: 2026, month: 7, day: 15 }, () => 0);
    expect(slots[0].cron).toBe("0 15 * * *");
  });

  test("returns 4 slots in chronological bucket order", () => {
    const slots = drawScheduledSlots({ year: 2026, month: 1, day: 15 }, () => 0);
    expect(slots).toHaveLength(4);
    expect(slots.map((s) => s.utc.getTime())).toEqual([...slots.map((s) => s.utc.getTime())].sort((a, b) => a - b));
  });

  test("stays within each bucket's 4-hour span regardless of rng draw", () => {
    const slots = drawScheduledSlots({ year: 2026, month: 1, day: 15 }, () => 0.9999);
    // Bucket 0 (10am-2pm Chicago, CST/UTC-6): just under 2pm -> just under 20:00 UTC.
    expect(slots[0].utc.getUTCHours()).toBe(19);
  });

  test("the last bucket (10pm-2am) rolls into the next UTC calendar day", () => {
    const slots = drawScheduledSlots({ year: 2026, month: 1, day: 15 }, () => 0);
    // 10pm CST on the 15th = 04:00 UTC on the 16th.
    expect(slots[3].utc.getUTCDate()).toBe(16);
    expect(slots[3].utc.getUTCHours()).toBe(4);
  });

  test("draws are independent per bucket (rng called once per bucket)", () => {
    let call = 0;
    const rng = () => [0, 0.5, 0.25, 0.75][call++];
    const slots = drawScheduledSlots({ year: 2026, month: 1, day: 15 }, rng);
    expect(call).toBe(4);
    expect(new Set(slots.map((s) => s.cron)).size).toBe(4);
  });
});

describe("drawScheduledSlots across a real DST transition", () => {
  test("fall-back (Nov 1, 2026): the last bucket stays monotonic across the 1am-1:59am fold", () => {
    // Window anchored Oct 31 (10am) has its last bucket (22:00-02:00) straddle
    // the fold, where 1:00-1:59am Chicago occurs twice (once CDT, once CST).
    const start = drawScheduledSlots({ year: 2026, month: 10, day: 31 }, () => 0)[3];
    const nearTop = drawScheduledSlots({ year: 2026, month: 10, day: 31 }, () => 0.999)[3];

    expect(start.utc.toISOString()).toBe("2026-11-01T03:00:00.000Z");
    // Resolves the ambiguous local time to its pre-transition (CDT) reading —
    // a deterministic choice, not a crash or NaN — and stays later than the
    // bucket's start, i.e. no backwards jump across the fold.
    expect(nearTop.utc.toISOString()).toBe("2026-11-01T06:59:00.000Z");
    expect(nearTop.utc.getTime()).toBeGreaterThan(start.utc.getTime());
  });

  test("spring-forward (Mar 8, 2026): the last bucket never lands in the skipped 2am-2:59am gap", () => {
    // Window anchored Mar 7 (10am) has its last bucket (22:00-02:00) approach
    // the spring-forward gap (2:00am-2:59am Chicago doesn't exist that day),
    // but the bucket's own range tops out at 1:59am, never reaching it.
    const nearTop = drawScheduledSlots({ year: 2026, month: 3, day: 7 }, () => 0.999)[3];
    expect(nearTop.utc.toISOString()).toBe("2026-03-08T07:59:00.000Z");
  });
});

describe("chicagoCalendarDate", () => {
  test("returns the Chicago-local date for a UTC instant late in the Chicago evening", () => {
    // 2026-01-15 23:00 UTC = 2026-01-15 17:00 CST — still the same Chicago day.
    const result = chicagoCalendarDate(new Date("2026-01-15T23:00:00Z"));
    expect(result).toEqual({ year: 2026, month: 1, day: 15 });
  });

  test("returns the prior Chicago-local date just after UTC midnight", () => {
    // 2026-01-16 03:00 UTC = 2026-01-15 21:00 CST — still the 15th in Chicago.
    const result = chicagoCalendarDate(new Date("2026-01-16T03:00:00Z"));
    expect(result).toEqual({ year: 2026, month: 1, day: 15 });
  });
});

describe("addDays", () => {
  test("adds a day within the same month", () => {
    expect(addDays({ year: 2026, month: 1, day: 15 }, 1)).toEqual({ year: 2026, month: 1, day: 16 });
  });

  test("rolls over a month boundary", () => {
    expect(addDays({ year: 2026, month: 1, day: 31 }, 1)).toEqual({ year: 2026, month: 2, day: 1 });
  });

  test("rolls over a year boundary", () => {
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({ year: 2027, month: 1, day: 1 });
  });

  test("supports subtracting days via a negative count", () => {
    expect(addDays({ year: 2026, month: 3, day: 1 }, -1)).toEqual({ year: 2026, month: 2, day: 28 });
  });
});

describe("currentWindowAnchorDate", () => {
  test("anchors to today when it's within the 10am-2am window's daytime portion", () => {
    // 2026-01-15 18:00 CST = 2026-01-16 00:00 UTC — mid-afternoon Chicago, clearly "today".
    const result = currentWindowAnchorDate(new Date("2026-01-16T00:00:00Z"));
    expect(result).toEqual({ year: 2026, month: 1, day: 15 });
  });

  test("anchors to yesterday during the post-midnight tail of the last bucket", () => {
    // 2026-01-16 01:00 CST = 2026-01-16 07:00 UTC — 1am Chicago, still last night's window.
    const result = currentWindowAnchorDate(new Date("2026-01-16T07:00:00Z"));
    expect(result).toEqual({ year: 2026, month: 1, day: 15 });
  });

  test("flips to the new anchor right at 10am Chicago", () => {
    // 2026-01-15 10:00 CST = 2026-01-15 16:00 UTC.
    const result = currentWindowAnchorDate(new Date("2026-01-15T16:00:00Z"));
    expect(result).toEqual({ year: 2026, month: 1, day: 15 });
  });
});
