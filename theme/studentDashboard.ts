/**
 * Student dashboard — bright, joyful edtech palette.
 * Soft pastel bases, saturated accents, per-tile color identity (not grey-on-grey).
 */

import { Platform, type ViewStyle } from 'react-native';

/** Hash string → stable index for rotating module colors */
export function studentDashboardPaletteIndex(key: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % modulo;
}

/** Icon circle pairs for module grid tiles */
export const STUDENT_MODULE_PALETTES = [
  { iconBg: '#EDE9FE', icon: '#6D28D9' },
  { iconBg: '#FCE7F3', icon: '#DB2777' },
  { iconBg: '#CFFAFE', icon: '#0E7490' },
  { iconBg: '#FEF3C7', icon: '#D97706' },
  { iconBg: '#D1FAE5', icon: '#059669' },
  { iconBg: '#FFE4E6', icon: '#E11D48' },
] as const;

export function getStudentModulePalette(label: string) {
  return STUDENT_MODULE_PALETTES[studentDashboardPaletteIndex(label, STUDENT_MODULE_PALETTES.length)];
}

/** Home 2×2 grid: attendance · class · fees · transport */
export const STUDENT_HOME_TILES = [
  {
    bg: '#FFF1F2',
    border: '#FDA4AF',
    iconBg: '#FFE4E6',
    icon: '#E11D48',
    ring: '#FB7185',
    ringTrack: '#FECDD3',
    cta: '#BE123C',
  },
  {
    bg: '#F5F3FF',
    border: '#C4B5FD',
    iconBg: '#EDE9FE',
    icon: '#6D28D9',
    ring: '#8B5CF6',
    ringTrack: '#DDD6FE',
    cta: '#5B21B6',
  },
  {
    bg: '#FFFBEB',
    border: '#FCD34D',
    iconBg: '#FEF3C7',
    icon: '#D97706',
    ring: '#FBBF24',
    ringTrack: '#FDE68A',
    cta: '#B45309',
  },
  {
    bg: '#ECFEFF',
    border: '#67E8F9',
    iconBg: '#CFFAFE',
    icon: '#0E7490',
    ring: '#22D3EE',
    ringTrack: '#A5F3FC',
    cta: '#0F766E',
  },
] as const;

export const studentDashboardTheme = {
  colors: {
    /** Main brand — vivid violet */
    primary: '#6D28D9',
    primaryBright: '#7C3AED',
    /** Pink accent — highlights, rings */
    accent: '#EC4899',
    accentCyan: '#06B6D4',
    accentAmber: '#F59E0B',
    accentEmerald: '#10B981',

    success: '#22C55E',
    warning: '#F97316',
    danger: '#EF4444',

    /** Screen — soft lavender / blush (not grey) */
    backgroundStart: '#FAF5FF',
    backgroundSecondary: '#FDF2F8',
    backgroundEnd: '#ECFEFF',

    /** Cards — clean white reads well on pastel page */
    surface: '#FFFFFF',
    secondarySurface: '#EDE9FE',
    cardBg: '#FFFFFF',

    /** Borders — tinted, not neutral grey */
    border: 'rgba(109, 40, 217, 0.14)',
    borderSubtle: 'rgba(109, 40, 217, 0.09)',

    /** Text — deep indigo/violet (readable, still colourful vs slate grey) */
    textPrimary: '#312E81',
    textSecondary: '#5B21B6',
    textMuted: '#7C3AED',

    primaryBg: '#FAF5FF',
    primaryLight: '#EDE9FE',
    highlight: '#7C3AED',

    /** Header gradient stops (LinearGradient) */
    headerGradient: ['#EDE9FE', '#FCE7F3', '#E0F2FE'] as const,
  },

  webSolid: {
    borderCard: 'rgba(109, 40, 217, 0.14)',
    borderSubtle: 'rgba(109, 40, 217, 0.09)',
    iconCircleBg: '#EDE9FE',
    ovalBg: 'rgba(236, 72, 153, 0.12)',
    accentMuted: '#F5F3FF',
    accentPressed: '#EDE9FE',
  },

  cardRadius: 20,
  cardRadiusLg: 22,
  cardPadding: 16,

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

const glassCardBase: ViewStyle = {
  backgroundColor: studentDashboardTheme.colors.surface,
  borderRadius: studentDashboardTheme.cardRadius,
  borderWidth: 1.5,
  borderColor: studentDashboardTheme.colors.border,
};

const glassCardShadow: ViewStyle =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
      }
    : Platform.OS === 'android'
      ? { elevation: 4 }
      : {};

export const studentDashboardCardStyle: ViewStyle = { ...glassCardBase, ...glassCardShadow };

export type StudentDashboardTheme = typeof studentDashboardTheme;
