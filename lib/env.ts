/**
 * Environment variables for Expo.
 * Use EXPO_PUBLIC_* in .env or app.config.js extra.
 */

import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

function getEnv(key: string, fallback = ''): string {
  // Expo SDK 50+: process.env.EXPO_PUBLIC_* at build
  const processVal = typeof process !== 'undefined' && process.env?.[key];
  if (processVal) return processVal;
  if (extra[key]) return extra[key];
  return fallback;
}

/** Strip trailing slash so client can append paths like /api/auth/login */
function normalizeBaseUrl(url: string): string {
  return url ? url.replace(/\/+$/, '') : '';
}

const DEFAULT_API_BASE_URL = 'https://smart-school-system-pmdb.vercel.app';

function getApiBaseUrl(): string {
  const fromEnv =
    getEnv('EXPO_PUBLIC_API_BASE_URL', '') || getEnv('EXPO_PUBLIC_API_URL', '');
  const url = fromEnv || DEFAULT_API_BASE_URL;
  // Ensure old domain is never used (e.g. cached env or wrong .env)
  if (url.includes('educorerp.in')) {
    return DEFAULT_API_BASE_URL;
  }
  return normalizeBaseUrl(url);
}

export const env = {
  /** API base URL for backend (e.g. https://smart-school-system-pmdb.vercel.app) — no trailing slash */
  API_BASE_URL: getApiBaseUrl(),
  /** Supabase project URL */
  SUPABASE_URL: getEnv('EXPO_PUBLIC_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL', ''),
  /** Supabase anon key (client-safe) */
  SUPABASE_ANON_KEY:
    getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
  /** When true, login uses Supabase tables (accepted_schools, staff, students) instead of API or email auth */
  USE_SUPABASE_TABLE_AUTH: getEnv('EXPO_PUBLIC_USE_SUPABASE_TABLE_AUTH', '').toLowerCase() === 'true',
  /** When true, dashboard and all module data (stats, classes, students, staff, institute, etc.) is fetched from Supabase (avoids CORS) */
  USE_SUPABASE_DASHBOARD: getEnv('EXPO_PUBLIC_USE_SUPABASE_DASHBOARD', '').toLowerCase() === 'true',
} as const;
