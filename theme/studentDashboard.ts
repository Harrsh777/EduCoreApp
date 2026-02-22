/**
 * Student Dashboard theme: premium light EdTech.
 * No shadows; simple text and flat cards.
 */

import { Platform } from 'react-native';

// ─── Design system ───────────────────────────────────────────────────────────
export const studentDashboardTheme = {
  colors: {
    primary: '#2D62FF',
    primaryLight: '#EAF1FF',
    success: '#16C784',
    danger: '#FF4D4F',
    warning: '#FF9F0A',

    backgroundStart: '#F8FAFF',
    backgroundEnd: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#EEF2F7',
    borderSubtle: '#F1F5F9',

    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',

    primaryBg: '#F8FAFF',
    secondarySurface: '#FFFFFF',
    cardBg: '#FFFFFF',
    highlight: '#2D62FF',
    textNormal: {},
  },

  webSolid: {
    borderCard: '#EEF2F7',
    borderSubtle: '#F1F5F9',
    iconCircleBg: '#EAF1FF',
    ovalBg: '#EAF1FF',
    accentMuted: '#EAF1FF',
    accentPressed: '#E0EBFF',
  },

  cardRadius: 22,
  cardRadiusLg: 24,
  cardPadding: 20,

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  } as const,

  minTouchHeight: 44,

  screenRootWeb:
    Platform.OS === 'web'
      ? {
          WebkitFontSmoothing: 'antialiased' as const,
          MozOsxFontSmoothing: 'grayscale' as const,
          isolation: 'isolate' as const,
        }
      : {},
} as const;

export type StudentDashboardTheme = typeof studentDashboardTheme;
