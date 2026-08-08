// CSV helpers for Excel-friendly export.
//
// Excel treats a quoted numeric cell (e.g. "0912") as a number when opening a
// CSV file and silently drops the leading zero — so a Myanmar phone number
// entered as "0912345678" would appear as "912345678". Wrapping a value in an
// Excel text formula (="0912345678") forces Excel/Google Sheets to keep it as
// text and display the leading "0".
//
// The formula wrapping also neutralizes CSV formula-injection: a value that
// starts with =, +, - or @ is never executed — it is rendered as literal text.

// Text cell: forces Excel to treat the value as text (phone numbers, etc.).
export function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""')
  return `"=""${escaped}"""`
}

// Plain CSV-escaped field for values that are already strings (names, emails,
// addresses) — quotes are doubled so commas/quotes in the value don't break
// the CSV structure.
export function csvField(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}
