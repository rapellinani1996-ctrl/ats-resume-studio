const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/**
 * Normalize common resume date formats to DD/MM/YY (day defaults to 01).
 * "Present"/"Current" stay as "Present". Unrecognizable values are returned
 * trimmed but unchanged so the user can see and fix them.
 */
export function normalizeDate(v: string): string {
  const s = v.trim();
  if (!s) return "";
  if (/present|current|till date|now/i.test(s)) return "Present";
  let m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})$/); // DD/MM/YY or DD/MM/YYYY
  if (m) return `${m[1]!.padStart(2, "0")}/${m[2]!.padStart(2, "0")}/${m[3]!.slice(-2)}`;
  m = s.match(/^(\d{1,2})[/\-.](\d{4})$/); // MM/YYYY
  if (m) return `01/${m[1]!.padStart(2, "0")}/${m[2]!.slice(-2)}`;
  m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/); // Jun 2021 / June 2021
  if (m) {
    const mon = MONTHS[m[1]!.slice(0, 3).toLowerCase()];
    if (mon) return `01/${mon}/${m[2]!.slice(-2)}`;
  }
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})$/); // 15 June 2021
  if (m) {
    const mon = MONTHS[m[2]!.slice(0, 3).toLowerCase()];
    if (mon) return `${m[1]!.padStart(2, "0")}/${mon}/${m[3]!.slice(-2)}`;
  }
  m = s.match(/^(\d{4})$/); // 2021
  if (m) return `01/01/${m[1]!.slice(-2)}`;
  return s;
}
