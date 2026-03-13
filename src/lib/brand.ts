/**
 * Converts a hex color (#rrggbb) to an oklch CSS string.
 * Used to inject per-customer brand color as a CSS variable.
 *
 * For now we pass the hex through directly as a fallback —
 * modern browsers accept hex in custom properties fine.
 * When Supabase is connected, swap this for a proper hex→oklch conversion.
 */
export function applyBrandColor(color: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--brand", color);
}
