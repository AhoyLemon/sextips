import { describe, expect, test } from "bun:test";

import { convertTipHtmlForBluesky } from "../ts/lib/tipHtml";

describe("convertTipHtmlForBluesky", () => {
  test("uppercases text wrapped in <i>", () => {
    expect(convertTipHtmlForBluesky("this dick has been <i>dead for six years</i>.")).toBe(
      "this dick has been DEAD FOR SIX YEARS.",
    );
  });

  test("uppercases <b>, <strong>, and <em> the same way", () => {
    expect(convertTipHtmlForBluesky("<b>bold</b> <strong>strong</strong> <em>em</em>")).toBe("BOLD STRONG EM");
  });

  test("converts <br /> to a newline", () => {
    expect(convertTipHtmlForBluesky("first line<br />-Slug, 35")).toBe("first line\n-Slug, 35");
  });

  test("strips an unrecognized tag as a fallback", () => {
    expect(convertTipHtmlForBluesky("Bring It On</>")).toBe("Bring It On");
  });

  test("leaves plain text untouched", () => {
    expect(convertTipHtmlForBluesky("no tags here")).toBe("no tags here");
  });
});
