/**
 * Prepares admin/editor description text for react-markdown + remark-gfm + remark-breaks.
 * EasyMDE / Word paste often uses tabs; only real two-column rows become tables.
 */

/** Break pasted single-line listings before common field / feature emojis. */
const INLINE_EMOJI_BREAK =
  /(?<=\s)(?=(?:📅|🚪|⚙️|🔋|💨|⚡|🌍|🌡️|🚘|📷|🅿️|🛣️|🚨|👁️|🪑|🔥|🌞|🔑|🎵|📱|📶|🔌|🌐|✔️|📍|🏁|⚠️)\s)/g;

/** Section titles like "Comfort & Technology" (not spec table rows). */
const SECTION_TITLE =
  /^(?:[\p{Extended_Pictographic}\uFE0F]+\s*)*(?:Comfort\s*&\s*Technology|Vehicle\s*Overview|Key\s*Specifications|Visit\s*Us|Disclaimer)\s*$/iu;

function splitTabCells(line: string): string[] {
  return line.split("\t").map((c) => c.trim());
}

function nonEmptyCells(line: string): string[] {
  return splitTabCells(line).filter((c) => c.length > 0);
}

/** True spec table row: Feature + Details (both cells have text). */
function isDataTableRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || !line.includes("\t")) return false;
  return nonEmptyCells(line).length >= 2;
}

/** Pasted list row: text + trailing tab(s) → only one non-empty cell. */
function isSingleColumnTabRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || !line.includes("\t")) return false;
  return nonEmptyCells(line).length === 1;
}

function normalizeListingLine(line: string): string {
  if (line.includes("\t")) {
    const only = nonEmptyCells(line);
    if (only.length === 1) line = only[0];
    else if (only.length === 0) return "";
  }
  return line
    .replace(/\s•\s/g, "\n- ")
    .replace(INLINE_EMOJI_BREAK, "\n");
}

function formatFeatureListBlock(items: string[]): string[] {
  const result: string[] = [];
  let i = 0;

  while (i < items.length) {
    const text = items[i].trim();
    if (!text) {
      i++;
      continue;
    }

    if (SECTION_TITLE.test(text) || (i === 0 && items.length > 1)) {
      const looksLikeSection =
        SECTION_TITLE.test(text) ||
        (/^[\p{Extended_Pictographic}\uFE0F]/u.test(text) &&
          text.length < 80 &&
          !text.includes(":"));

      if (looksLikeSection && i < items.length - 1) {
        result.push("");
        result.push(`### ${text}`);
        result.push("");
        i++;
        continue;
      }
    }

    result.push(`- ${text}`);
    i++;
  }

  result.push("");
  return result;
}

export function formatProductDescription(raw: string): string {
  if (!raw?.trim()) return "";

  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isDataTableRow(line)) {
      const rows: string[][] = [];
      let j = i;
      while (j < lines.length && isDataTableRow(lines[j])) {
        rows.push(nonEmptyCells(lines[j]));
        j++;
      }

      if (rows.length > 0) {
        const colCount = Math.max(...rows.map((r) => r.length));
        const pad = (cells: string[]) => {
          const row = [...cells];
          while (row.length < colCount) row.push("");
          return row;
        };

        const [header, ...body] = rows;
        out.push(`| ${pad(header).join(" | ")} |`);
        out.push(`| ${Array(colCount).fill("---").join(" | ")} |`);
        for (const row of body) {
          out.push(`| ${pad(row).join(" | ")} |`);
        }
        out.push("");
        i = j;
        continue;
      }
    }

    if (isSingleColumnTabRow(line)) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length) {
        const row = lines[j].trim();
        if (!row) {
          j++;
          continue;
        }
        if (!isSingleColumnTabRow(lines[j])) break;
        const cell = nonEmptyCells(lines[j])[0];
        if (cell) items.push(cell);
        j++;
      }

      if (items.length > 0) {
        out.push(...formatFeatureListBlock(items));
        i = j;
        continue;
      }
    }

    const normalized = normalizeListingLine(line);
    if (normalized) out.push(normalized);
    i++;
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
