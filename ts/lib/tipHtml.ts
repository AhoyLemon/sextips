const EMPHASIS_TAG_PATTERN = /<(b|i|strong|em)>(.*?)<\/\1>/gi;
const BREAK_TAG_PATTERN = /<br\s*\/?>/gi;
const ANY_TAG_PATTERN = /<[^>]+>/g;

/**
 * Tip data is authored for `v-html` rendering on the site, so it carries
 * emphasis and line-break tags. BlueSky has no rich text (only link/mention/
 * hashtag facets), so tags would otherwise post as literal angle brackets.
 * Emphasis becomes ALLCAPS, `<br />` becomes a newline, and any other tag is
 * stripped as a fallback so an unhandled tag can't leak through as raw text.
 */
export function convertTipHtmlForBluesky(tip: string): string {
  const withEmphasis = tip.replace(EMPHASIS_TAG_PATTERN, (_match, _tag, inner: string) => inner.toUpperCase());
  const withLineBreaks = withEmphasis.replace(BREAK_TAG_PATTERN, "\n");
  return withLineBreaks.replace(ANY_TAG_PATTERN, "");
}
