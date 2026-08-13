import type { TipCategory } from "../../ts/lib/tipGenerator";

/**
 * Never part of the real sexActs data set — exists purely to exercise
 * generateBlueskyTip's HTML-to-plain-text conversion (emphasis tags and
 * <br />) ahead of the grapheme-limit check.
 */
export const htmlTipTest: TipCategory = ["this dick has been <i>dead</i> for six years.<br />-Slug, 35"];
