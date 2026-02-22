/**
 * Production-grade color palette for School ERP mobile app.
 * Semantic tokens for light/dark and consistent UI.
 */

export const colors = {
  // Primary brand
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Neutral grayscale
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Semantic
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#047857',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#B45309',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#B91C1C',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1D4ED8',
  },

  // Surface & background
  surface: {
    default: '#FFFFFF',
    subdued: '#F9FAFB',
    elevated: '#FFFFFF',
  },
  background: {
    default: '#F3F4F6',
    app: '#FFFFFF',
  },

  // Text
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#4F46E5',
  },

  // Border
  border: {
    default: '#E5E7EB',
    strong: '#D1D5DB',
    focus: '#6366F1',
  },
} as const;

export const darkColors = {
  ...colors,
  surface: {
    default: '#1F2937',
    subdued: '#111827',
    elevated: '#374151',
  },
  background: {
    default: '#030712',
    app: '#111827',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
    inverse: '#111827',
    link: '#818CF8',
  },
  border: {
    default: '#374151',
    strong: '#4B5563',
    focus: '#818CF8',
  },
} as const;

export type ColorScheme = typeof colors;
