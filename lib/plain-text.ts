/**
 * Turns an admin markdown description into plain text for meta/OG descriptions,
 * so link previews (LinkedIn, WhatsApp, Google) don't show `**`, `#` or list markers.
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "") // list markers
    .replace(/^\s*>\s?/gm, "") // blockquotes
    .replace(/^\s*\|?\s*:?-{2,}.*$/gm, " ") // table separator rows
    .replace(/[|]/g, " ")
    .replace(/(\*\*|__|\*|_|~~|`)/g, "") // emphasis / code marks
    .replace(/\s+/g, " ")
    .trim();
}

/** Cuts at a word boundary and adds an ellipsis when the text is longer than `max`. */
export function truncateAtWord(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
