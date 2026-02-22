/**
 * Typography: one clear sans (Inter / Plus Jakarta Sans / DM Sans) across app.
 * Use same heading/body pair; only colour changes by area.
 */

export const fontFamily = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
} as const;

/** Set after loading e.g. Plus Jakarta Sans: { regular: 'PlusJakartaSans-Regular', ... } */
export const customFontFamily: Partial<Record<keyof typeof fontFamily, string>> = {};
export function getFontFamily(key: keyof typeof fontFamily): string {
  return customFontFamily[key] ?? fontFamily[key];
}

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const lineHeight = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export type Typography = {
  fontFamily: keyof typeof fontFamily;
  fontSize: keyof typeof fontSize;
  lineHeight: keyof typeof lineHeight;
  fontWeight: keyof typeof fontWeight;
};

export const textStyles = {
  hero: {
    fontSize: fontSize['4xl'],
    lineHeight: lineHeight.tight,
    fontWeight: fontWeight.bold,
  },
  tagline: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.relaxed,
    fontWeight: fontWeight.normal,
  },
  h1: {
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight.tight,
    fontWeight: fontWeight.bold,
  },
  h2: {
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.tight,
    fontWeight: fontWeight.bold,
  },
  h3: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.snug,
    fontWeight: fontWeight.semiBold,
  },
  h4: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    fontWeight: fontWeight.semiBold,
  },
  body: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.normal,
  },
  bodySm: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.normal,
  },
  caption: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.normal,
  },
  label: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.medium,
  },
  button: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.semiBold,
  },
} as const;
