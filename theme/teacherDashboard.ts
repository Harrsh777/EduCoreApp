/**
 * Teacher dashboard theme: production-grade green + white.
 * Primary Green: #16A34A, Light: #DCFCE7, Dark Text: #0F172A, Muted: #64748B, Background: #F8FAFC.
 */

export const teacherDashboardTheme = {
  colors: {
    primary: '#16A34A',
    primaryLight: '#DCFCE7',
    primaryDark: '#166534',
    success: '#16A34A',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    amber: '#F59E0B',
    blue: '#3B82F6',
    blueLight: '#EFF6FF',

    background: '#F8FAFC',
    backgroundStart: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',

    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textDark: '#0F172A',
    textMuted: '#64748B',
  },
  cardRadius: 16,
  cardRadiusLg: 20,
  radii: { full: 9999 },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  } as const,
};

export type TeacherDashboardTheme = typeof teacherDashboardTheme;
