/**
 * Lightwell tenant root config — top of the config cascade.
 *
 * Cascade:
 *   lightwell.config.ts  ← here (tenant identity)
 *     └── components/components.config.ts  (primitive + assembly defaults)
 *           └── Lw* roots  (mergeComponentProps; call-site wins)
 *
 * Add brand tokens, palette intent, and shared Lightwell identity here as the kit grows.
 * Domain configs import from here; they do not define tenant identity themselves.
 *
 * Current state: identity constants only. Token and palette values land when
 * primitives (LwBrand, LwLabel, etc.) require them.
 */
export const lightwellConfig = {
  /** CSS class prefix for all Lightwell kit units. */
  cssPrefix: 'lightwell',
  /** Export / component name prefix for all Lw* kit units. */
  exportPrefix: 'lw',
  /**
   * Class chrome adds on `<html>` for Lightwell routes.
   * Kit co-located CSS is webpack-scoped to `html.${htmlThemeClass}` (fec KitCssScopePlugin).
   */
  htmlThemeClass: 'lightwell-v1-theme',
} as const;
