/**
 * Institute / school info APIs. When USE_SUPABASE_DASHBOARD, data from accepted_schools.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import {
  getAcceptedSchoolsFromSupabase,
  getInstituteHousesFromSupabase,
  getInstituteWorkingDaysFromSupabase,
  patchInstituteFromSupabase,
} from './institute.supabase';

const p = (school_code: string) => ({ params: { school_code } });

/** GET /api/schools/accepted */
export function getAcceptedSchools(params?: { school_code?: string }) {
  if (env.USE_SUPABASE_DASHBOARD) return getAcceptedSchoolsFromSupabase(params);
  return api.get('/api/schools/accepted', { params });
}

/** GET /api/institute/... (working-days, houses, etc.) */
export function getInstitute(school_code: string, path: string) {
  return api.get(`/api/institute/${path}`, p(school_code));
}

export function getInstituteWorkingDays(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getInstituteWorkingDaysFromSupabase(school_code);
  return api.get('/api/institute/working-days', p(school_code));
}

export function getInstituteHouses(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getInstituteHousesFromSupabase(school_code);
  return api.get('/api/institute/houses', p(school_code));
}

/** PATCH /api/institute/... */
export function patchInstitute(school_code: string, path: string, body: Record<string, unknown>) {
  if (env.USE_SUPABASE_DASHBOARD) return patchInstituteFromSupabase(school_code, path, body);
  return api.patch(`/api/institute/${path}`, body, p(school_code));
}

export const instituteService = {
  getAcceptedSchools,
  getInstitute,
  getInstituteWorkingDays,
  getInstituteHouses,
  patchInstitute,
};
