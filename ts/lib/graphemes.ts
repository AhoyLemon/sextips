/** Counts user-perceived characters (graphemes) rather than UTF-16 code units, matching BlueSky's 300-grapheme post limit. */
export function graphemeLength(text: string): number {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return [...segmenter.segment(text)].length;
}
