/**
 * Prepares admin/editor description text for react-markdown + remark-gfm + remark-breaks.
 * EasyMDE often stores tab-separated rows (Excel/Word paste) instead of pipe tables.
 */

/** Break pasted single-line listings before common field / feature emojis. */
const INLINE_EMOJI_BREAK =
  /(?<=\s)(?=(?:📅|🚪|⚙️|🔋|💨|⚡|🌍|🌡️|🚘|📷|🅿️|🛣️|🚨|👁️|🪑|🔥|🌞|🔑|🎵|📱|📶|🔌|🌐|✔️|📍|🏁|⚠️)\s)/g;

function normalizeListingLine(line: string): string {
  if (line.includes("\t")) return line;
  return line
    .replace(/\s•\s/g, "\n- ")
    .replace(INLINE_EMOJI_BREAK, "\n");
}

export function formatProductDescription(raw: string): string {
  if (!raw?.trim()) return "";

  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;

  const isTableRow = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const cells = line.split("\t").map((c) => c.trim());
    return cells.length >= 2 && cells.some((c) => c.length > 0);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (isTableRow(line)) {
      const rows: string[][] = [];
      let j = i;
      while (j < lines.length && isTableRow(lines[j])) {
        rows.push(lines[j].split("\t").map((c) => c.trim()));
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

    out.push(normalizeListingLine(line));
    i++;
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
