import { describe, expect, test } from "bun:test";

import {
  countPostsToday,
  deriveTicksSinceLastPost,
  rollShouldPost,
  TICK_MINUTES,
} from "../ts/lib/postSchedule";

describe("deriveTicksSinceLastPost", () => {
  test("returns Infinity when there is no post history", () => {
    const now = new Date("2026-08-12T12:00:00Z");
    expect(deriveTicksSinceLastPost([], now)).toBe(Infinity);
  });

  test("returns the tick count since the most recent post", () => {
    const now = new Date("2026-08-12T12:00:00Z");
    const ninetyMinutesAgo = new Date(now.getTime() - 90 * 60 * 1000);
    expect(deriveTicksSinceLastPost([ninetyMinutesAgo], now)).toBe(2);
  });

  test("uses the most recent timestamp when given an unsorted list", () => {
    const now = new Date("2026-08-12T12:00:00Z");
    const oneTickAgo = new Date(now.getTime() - TICK_MINUTES * 60 * 1000);
    const tenTicksAgo = new Date(now.getTime() - 10 * TICK_MINUTES * 60 * 1000);
    expect(deriveTicksSinceLastPost([tenTicksAgo, oneTickAgo], now)).toBe(1);
  });
});

describe("countPostsToday", () => {
  test("excludes a post just before UTC midnight and includes one just after", () => {
    const now = new Date("2026-08-12T00:30:00Z");
    const yesterdayLateNight = new Date("2026-08-11T23:59:00Z");
    const todayEarlyMorning = new Date("2026-08-12T00:05:00Z");
    expect(countPostsToday([yesterdayLateNight, todayEarlyMorning], now)).toBe(1);
  });

  test("counts multiple posts on the same UTC day", () => {
    const now = new Date("2026-08-12T18:00:00Z");
    const posts = [
      new Date("2026-08-12T01:00:00Z"),
      new Date("2026-08-12T09:00:00Z"),
      new Date("2026-08-11T23:00:00Z"),
    ];
    expect(countPostsToday(posts, now)).toBe(2);
  });
});

describe("rollShouldPost", () => {
  test("never posts at tick 0 regardless of rng", () => {
    expect(rollShouldPost(0, () => 0)).toBe(false);
  });

  test("posts at the p=0.9 cap boundary just under it", () => {
    expect(rollShouldPost(18, () => 0.89)).toBe(true);
  });

  test("does not post at the p=0.9 cap boundary just over it", () => {
    expect(rollShouldPost(18, () => 0.91)).toBe(false);
  });

  test("probability never exceeds the 0.9 cap even with an infinite tick count", () => {
    expect(rollShouldPost(Infinity, () => 0.89)).toBe(true);
    expect(rollShouldPost(Infinity, () => 0.91)).toBe(false);
  });
});
