/** A leaf value in the tip data: a literal string, or (rarely) a literal number. */
export type TipLeaf = string | number;

/** A tip-data node: either a leaf, or an array to be resolved recursively. */
export type TipNode = TipLeaf | TipNode[];

/** One "category" of tips (e.g. blowjobs, handjobs) — an array of TipNode. */
export type TipCategory = TipNode[];

/** The full data set — an array of categories, matching the original `sexActs` global. */
export type SexActs = TipCategory[];

/**
 * Resolves a single top-level category element per the original alternating
 * iterate/pick-one semantics (ported verbatim from generateSexTip in the
 * pre-TypeScript js/partials/_vue.js):
 *   k       -> if array, pick ONE random element (k[z])
 *   k[z]    -> if array, iterate ALL elements
 *   a       -> if array, pick ONE random element, appended with no further recursion
 * This is not a generic recursive flattener — it's exactly these three levels,
 * matching the deepest nesting found in the real tip data.
 */
export function resolveNode(k: TipNode, rng: () => number = Math.random): string {
  if (!Array.isArray(k)) return String(k);

  const z = Math.floor(rng() * k.length);
  const kz = k[z];
  if (!Array.isArray(kz)) return String(kz);

  let out = "";
  for (const a of kz) {
    if (!Array.isArray(a)) {
      out += String(a);
    } else {
      out += String(a[Math.floor(rng() * a.length)]);
    }
  }
  return out;
}

/**
 * Pure port of generateSexTip's string-building algorithm. Picks a random
 * category from sexActs, walks its elements, and concatenates the resolved
 * string. No DOM, no Vue, no Audio — usable from a browser <script type="module">
 * or a plain Node/Bun script (e.g. a future BlueSky auto-poster).
 */
export function generateTip(sexActs: SexActs, rng: () => number = Math.random): string {
  const categoryIndex = Math.floor(rng() * sexActs.length);
  const category = sexActs[categoryIndex];

  let result = "";
  for (const k of category) {
    result += resolveNode(k, rng);
  }
  return result;
}
