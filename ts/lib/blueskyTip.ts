import { generateTip, type SexActs } from "./tipGenerator.js";
import { graphemeLength } from "./graphemes.js";

export interface GenerateBlueskyTipOptions {
  maxGraphemes?: number;
  maxAttempts?: number;
  rng?: () => number;
}

/**
 * Generates a tip that fits within BlueSky's grapheme limit, regenerating
 * on overflow. Returns null (never throws) if maxAttempts is exhausted —
 * the caller should log a warning and skip that tick rather than posting
 * something malformed.
 */
export function generateBlueskyTip(sexActs: SexActs, opts: GenerateBlueskyTipOptions = {}): string | null {
  const { maxGraphemes = 300, maxAttempts = 20, rng = Math.random } = opts;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tip = generateTip(sexActs, rng);
    if (graphemeLength(tip) <= maxGraphemes) return tip;
  }

  return null;
}
