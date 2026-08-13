import { describe, expect, test } from "bun:test";

import { generateBlueskyTip } from "../ts/lib/blueskyTip";
import { arrayInArrayTest } from "./fixtures/_arrayInArrayTest";
import { htmlTipTest } from "./fixtures/_htmlTipTest";

describe("generateBlueskyTip", () => {
  test("returns a tip within the grapheme limit", () => {
    const zeroRng = () => 0;
    const tip = generateBlueskyTip([arrayInArrayTest], { rng: zeroRng, maxGraphemes: 300 });
    expect(tip).toBe("Help him slap his own nutsack.");
  });

  test("converts HTML before checking the grapheme limit", () => {
    const zeroRng = () => 0;
    const tip = generateBlueskyTip([htmlTipTest], { rng: zeroRng, maxGraphemes: 300 });
    expect(tip).toBe("this dick has been DEAD for six years.\n-Slug, 35");
  });

  test("returns null rather than throwing or looping forever when no tip can fit", () => {
    const tip = generateBlueskyTip([arrayInArrayTest], { maxGraphemes: 0, maxAttempts: 5 });
    expect(tip).toBeNull();
  });
});
