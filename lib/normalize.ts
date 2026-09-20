// Normalizes a name for login matching: strips anything after a comma
// (gelar is almost always appended there, e.g. "Budi Santoso, S.Kom."),
// drops periods, lowercases, and collapses whitespace.
export function normalizeNama(nama: string): string {
  return nama
    .split(",")[0]
    .replace(/\./g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
