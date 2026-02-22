/**
 * Spacing scale for consistent layout (4px base).
 * Use for padding, margin, gap.
 */

const base = 4;

export const spacing = {
  0: 0,
  0.5: base * 0.5,   // 2
  1: base,           // 4
  1.5: base * 1.5,   // 6
  2: base * 2,       // 8
  2.5: base * 2.5,   // 10
  3: base * 3,       // 12
  4: base * 4,       // 16
  5: base * 5,       // 20
  6: base * 6,       // 24
  8: base * 8,       // 32
  10: base * 10,     // 40
  12: base * 12,     // 48
  16: base * 16,     // 64
  20: base * 20,     // 80
  24: base * 24,     // 96
} as const;

export type SpacingKey = keyof typeof spacing;

export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const borderWidth = {
  0: 0,
  1: 1,
  2: 2,
  4: 4,
} as const;
