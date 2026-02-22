/**
 * Dashboard summary APIs. All GET with school_code. Same as web.
 * When EXPO_PUBLIC_USE_SUPABASE_DASHBOARD=true, stats/classes/financial come from Supabase (avoids CORS on localhost).
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getCalendarAcademicFromSupabase } from './calendar.supabase';
import {
  getClassesFromSupabase,
  getDashboardFinancialOverviewFromSupabase,
  getDashboardStatsDetailedFromSupabase,
  getDashboardStatsFromSupabase,
} from './dashboard.supabase';
import { getExaminationsListFromSupabase } from './examination.supabase';

const p = (school_code: string) => ({ params: { school_code } });

export function getCalendarAcademic(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getCalendarAcademicFromSupabase(school_code);
  return api.get('/api/calendar/academic', p(school_code));
}

export function getDashboardStats(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) {
    return getDashboardStatsFromSupabase(school_code).then((data) => ({ data }));
  }
  return api.get('/api/dashboard/stats', p(school_code));
}

export function getDashboardStatsDetailed(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) {
    return getDashboardStatsDetailedFromSupabase(school_code).then((data) => ({ data }));
  }
  return api.get('/api/dashboard/stats-detailed', p(school_code));
}

export function getDashboardFinancialOverview(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) {
    return getDashboardFinancialOverviewFromSupabase(school_code).then((data) => ({ data }));
  }
  return api.get('/api/dashboard/financial-overview', p(school_code));
}

export function getTimetableList(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) {
    return import('./timetable.supabase').then((m) =>
      m.getTimetableListFromSupabase(school_code).then((data) => ({ data }))
    );
  }
  return api.get('/api/timetable/list', p(school_code));
}

export function getDashboardAdministrative(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) {
    return Promise.resolve({ data: {} });
  }
  return api.get('/api/dashboard/administrative', p(school_code));
}

export function getExaminations(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getExaminationsListFromSupabase(school_code);
  return api.get('/api/examinations', p(school_code));
}

export function getClasses(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) {
    return getClassesFromSupabase(school_code).then((data) => ({ data }));
  }
  return api.get('/api/classes', p(school_code));
}

/** GET /api/download/{type}?school_code= — quick downloads (if used) */
export function getDownload(school_code: string, type: string, params?: Record<string, string>) {
  return api.get(`/api/download/${type}`, { params: { school_code, ...params } });
}

export const dashboardService = {
  getCalendarAcademic,
  getDashboardStats,
  getDashboardStatsDetailed,
  getDashboardFinancialOverview,
  getTimetableList,
  getDashboardAdministrative,
  getExaminations,
  getClasses,
  getDownload,
};
