import type { TipCategory } from "../../ts/lib/tipGenerator";

/**
 * Ported verbatim from js/partials/tips/_arrayInArrayTest.js. Never part of
 * the real sexActs data set — it exists purely to exercise the deepest
 * nesting the algorithm supports (the same depth real production data in
 * _suggestionsFromWomen.js reaches).
 */
export const arrayInArrayTest: TipCategory = [
  ["Help him", "Make him", "Force him to"],
  " ",
  [[["slap", "suck"], " his own ", ["nutsack", "elbow", "eyes"]], "apologise"],
  ".",
];
