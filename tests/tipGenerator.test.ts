import { describe, expect, test } from "bun:test";

import { generateTip, resolveNode } from "../ts/lib/tipGenerator";
import { arrayInArrayTest } from "./fixtures/_arrayInArrayTest";

describe("generateTip", () => {
  test("matches the original _vue.js algorithm exactly for a deterministic rng", () => {
    // A deterministic rng that always returns 0 always picks index 0 at every
    // "pick one" step. Hand-traced against the ORIGINAL generateSexTip in
    // js/partials/_vue.js (not this port) to prove behavioral equivalence:
    //   k = ["Help him", ...]      -> z=0 -> "Help him"
    //   k = " "                    -> "  "
    //   k = [[[...]], "apologise"] -> z=0 -> kz is an array -> iterate:
    //       a = ["slap","suck"]              -> pick index 0 -> "slap"
    //       a = " his own "                   -> " his own "
    //       a = ["nutsack","elbow","eyes"]   -> pick index 0 -> "nutsack"
    //   k = "."                    -> "."
    const zeroRng = () => 0;
    const result = generateTip([arrayInArrayTest], zeroRng);
    expect(result).toBe("Help him slap his own nutsack.");
  });

  test("resolveNode in isolation matches the same deterministic trace", () => {
    const zeroRng = () => 0;
    expect(resolveNode(arrayInArrayTest[0], zeroRng)).toBe("Help him");
    expect(resolveNode(arrayInArrayTest[1], zeroRng)).toBe(" ");
    expect(resolveNode(arrayInArrayTest[2], zeroRng)).toBe("slap his own nutsack");
    expect(resolveNode(arrayInArrayTest[3], zeroRng)).toBe(".");
  });

  test("with real randomness, every output falls within the fixture's fully enumerated output space", () => {
    // The fixture's structure fully determines a small, enumerable set of
    // possible outputs: 3 choices for "k1" x 7 choices for "k3" (6 nested
    // slap/suck x nutsack/elbow/eyes combos, plus the "apologise" branch).
    const starts = ["Help him", "Make him", "Force him to"];
    const verbs = ["slap", "suck"];
    const targets = ["nutsack", "elbow", "eyes"];

    const allowed = new Set<string>();
    for (const start of starts) {
      allowed.add(`${start} apologise.`);
      for (const verb of verbs) {
        for (const target of targets) {
          allowed.add(`${start} ${verb} his own ${target}.`);
        }
      }
    }
    expect(allowed.size).toBe(21);

    for (let i = 0; i < 200; i++) {
      const result = generateTip([arrayInArrayTest]);
      expect(allowed.has(result)).toBe(true);
    }
  });
});
