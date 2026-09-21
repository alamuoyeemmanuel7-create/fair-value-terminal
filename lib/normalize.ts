/**
 * PreStocks names things "Anthropic PreStocks" / symbol "ANTHROPIC".
 * Tessera names things "T-OpenAI" / code "tOpenAI".
 * This strips platform prefixes/suffixes so both resolve to the same
 * canonical company key, which is what lets us line them up side by side.
 */
export function canonicalCompany(rawName: string): string {
  return rawName
    .replace(/^T-/i, "")
    .replace(/\s*PreStocks\s*$/i, "")
    .trim()
    .toLowerCase();
}

export function displayCompany(rawName: string): string {
  const key = canonicalCompany(rawName);
  return key
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
