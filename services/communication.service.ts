/**
 * Communication / Notices APIs. When USE_SUPABASE_DASHBOARD, data from notices table.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getNoticesFromSupabase } from './communication.supabase';

const p = (school_code: string, extra?: Record<string, unknown>) => ({ params: { school_code, ...extra } });

/** GET /api/communication/notices */
export function getNotices(
  school_code: string,
  params?: { limit?: number; status?: string; category?: string; priority?: string }
) {
  if (env.USE_SUPABASE_DASHBOARD) return getNoticesFromSupabase(school_code, params);
  return api.get('/api/communication/notices', p(school_code, params as Record<string, string>));
}

/** POST /api/communication/notices (if supported) */
export function createNotice(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/communication/notices', body, p(school_code));
}

export const communicationService = {
  getNotices,
  createNotice,
};
