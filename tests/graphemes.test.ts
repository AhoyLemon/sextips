import { describe, expect, test } from "bun:test";

import { graphemeLength } from "../ts/lib/graphemes";

describe("graphemeLength", () => {
  test("matches .length for plain ASCII", () => {
    expect(graphemeLength("hello world")).toBe(11);
  });

  test("counts a ZWJ emoji sequence as a single grapheme", () => {
    const familyEmoji = "👨‍👩‍👧‍👦";
    expect(graphemeLength(familyEmoji)).toBe(1);
    expect(familyEmoji.length).toBeGreaterThan(1);
  });

  test("counts a combining-mark sequence as a single grapheme", () => {
    const eWithCombiningAcute = "é";
    expect(graphemeLength(eWithCombiningAcute)).toBe(1);
    expect(eWithCombiningAcute.length).toBe(2);
  });
});
