/** Interval, in minutes, between scheduled workflow runs (matches the cron in post-bluesky.yml). */
export const TICK_MINUTES = 45;

/** Hard cap on posts per UTC day. */
export const DAILY_CAP = 4;

/** ticksSinceLastPost is divided by this to derive the roll probability. */
export const PROBABILITY_TICK_DIVISOR = 20;

/** Roll probability never exceeds this value, even after a long gap. */
export const PROBABILITY_CAP = 0.9;

/**
 * How many ticks have elapsed since the most recent post. Returns Infinity
 * when there is no post history (e.g. a brand-new bot account) — this flows
 * into rollShouldPost as the capped probability, not a guaranteed post.
 */
export function deriveTicksSinceLastPost(postTimestamps: Date[], now: Date): number {
  if (postTimestamps.length === 0) return Infinity;

  const mostRecent = postTimestamps.reduce((latest, t) => (t > latest ? t : latest));
  const elapsedMinutes = (now.getTime() - mostRecent.getTime()) / (1000 * 60);
  return Math.floor(elapsedMinutes / TICK_MINUTES);
}

/** How many of the given timestamps fall on the same UTC calendar day as `now`. */
export function countPostsToday(postTimestamps: Date[], now: Date): number {
  return postTimestamps.filter(
    (t) =>
      t.getUTCFullYear() === now.getUTCFullYear() &&
      t.getUTCMonth() === now.getUTCMonth() &&
      t.getUTCDate() === now.getUTCDate()
  ).length;
}

/**
 * p = min(PROBABILITY_CAP, ticksSinceLastPost / PROBABILITY_TICK_DIVISOR).
 * rng defaults to Math.random but is injectable for deterministic tests.
 */
export function rollShouldPost(ticksSinceLastPost: number, rng: () => number = Math.random): boolean {
  const probability = Math.min(PROBABILITY_CAP, ticksSinceLastPost / PROBABILITY_TICK_DIVISOR);
  return rng() < probability;
}
