/** Format stored date (YYYY-MM-DD or dd-mm-yyyy) for display as dd-mm-yyyy */
export function formatDateDdMmYyyy(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  const trimmed = dateStr.trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-");
    return `${d}-${m}-${y}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}-${parsed.getFullYear()}`;
  }
  return trimmed;
}

/** Normalize display or ISO string to YYYY-MM-DD for storage */
export function toIsoDateString(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const ddMmYyyy = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddMmYyyy) {
    const [, d, m, y] = ddMmYyyy;
    return `${y}-${m}-${d}`;
  }
  return trimmed;
}
