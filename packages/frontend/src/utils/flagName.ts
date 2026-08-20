/**
 * Convert FEATURE_FLAG_SEND_SMS → Send SMS
 */
export function prettyFlagName(name: string): string {
  return name
    .replace(/^FEATURE_FLAG_/, "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Get a short category prefix for grouping
 */
export function flagCategory(name: string): string {
  const stripped = name.replace(/^FEATURE_FLAG_/, "");
  const prefix = stripped.split("_")[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
}
