/**
 * Area-specific color palettes for UI/UX consistency.
 * Landing = purple/white; Admin login = slate/blue; Teacher = green; Student = blue; Accountant = amber; Super Admin = slate/red.
 */

export type AreaKey =
  | 'landing'
  | 'adminLogin'
  | 'school'
  | 'teacher'
  | 'student'
  | 'accountant'
  | 'superAdmin';

export interface AreaPalette {
  primary: string;
  primaryDark?: string;
  accent?: string;
  background: string;
  backgroundSecondary?: string;
  cardBg?: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  border?: string;
  buttonGradient?: [string, string];
}

export const areaPalettes: Record<AreaKey, AreaPalette> = {
  landing: {
    primary: '#7C3AED', // violet-600
    primaryDark: '#6D28D9',
    accent: '#EDE9FE', // lavender
    background: '#FFFFFF',
    backgroundSecondary: '#FAF5FF',
    cardBg: 'rgba(255,255,255,0.75)',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textInverse: '#FFFFFF',
    border: 'rgba(124,58,237,0.2)',
    buttonGradient: ['#7C3AED', '#6D28D9'],
  },
  adminLogin: {
    primary: '#4B5563',
    primaryDark: '#374151',
    accent: '#F3F4F6',
    background: '#F9FAFB',
    backgroundSecondary: '#F3F4F6',
    cardBg: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textInverse: '#FFFFFF',
    border: '#E5E7EB',
  },
  school: {
    primary: '#4F46E5',
    primaryDark: '#4338CA',
    accent: '#E0E7FF',
    background: '#F9FAFB',
    backgroundSecondary: '#FFFFFF',
    cardBg: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textInverse: '#FFFFFF',
    border: '#E5E7EB',
  },
  teacher: {
    primary: '#166534', // dark green
    primaryDark: '#14532D',
    accent: '#DCFCE7',
    background: '#FFFFFF',
    backgroundSecondary: '#F0FDF4',
    cardBg: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textInverse: '#FFFFFF',
    border: '#E5E7EB',
    buttonGradient: ['#166534', '#14532D'],
  },
  student: {
    primary: '#1e3a5f', // navy blue
    primaryDark: '#1e293b',
    accent: '#DBEAFE',
    background: '#FFFFFF',
    backgroundSecondary: '#EFF6FF',
    cardBg: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textInverse: '#FFFFFF',
    border: '#E5E7EB',
    buttonGradient: ['#1e3a5f', '#1e293b'],
  },
  accountant: {
    primary: '#D97706', // amber-600
    primaryDark: '#B45309',
    accent: '#FFFBEB', // amber-50
    background: '#FFFFFF',
    backgroundSecondary: '#FFFBEB',
    cardBg: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textInverse: '#FFFFFF',
    border: '#E5E7EB',
    buttonGradient: ['#D97706', '#B45309'],
  },
  superAdmin: {
    primary: '#4F46E5',
    primaryDark: '#4338CA',
    accent: '#DC2626', // red for "Protected"
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    cardBg: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textInverse: '#FFFFFF',
    border: 'rgba(148,163,184,0.3)',
  },
};
