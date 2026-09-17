/** Builds an RFC-4180-ish CSV string from a header row and data rows.
 * Every cell is stringified and quoted if it contains a comma, quote, or
 * newline — good enough for Excel/Sheets, which is all these exports need. */
export function toCsv(header: string[], rows: (string | number)[][]): string {
  function cell(value: string | number): string {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  }
  const lines = [header, ...rows].map((row) => row.map(cell).join(","));
  return lines.join("\r\n");
}

export function csvResponse(filename: string, header: string[], rows: (string | number)[][]) {
  const csv = toCsv(header, rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
