/** Cells starting with these chars can trigger formula injection in Excel/Sheets. */
const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * Escape a CSV cell: quote wrapping, quote doubling, formula-prefix neutralization.
 */
export function escapeCsvCell(value) {
  let s = String(value ?? "");
  if (CSV_FORMULA_PREFIX.test(s)) {
    s = `\t${s}`;
  }
  return `"${s.replace(/"/g, '""')}"`;
}

/** @param {string[]} header @param {string[][]} rows */
export function buildCsvContent(header, rows) {
  const lines = [
    header.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return `\ufeff${lines.join("\n")}`;
}
