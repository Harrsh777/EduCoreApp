/**
 * Gate pass / Front office APIs. Same as web.
 */

import { api } from '@/lib/api';

const p = (school_code: string, extra?: Record<string, unknown>) => ({ params: { school_code, ...extra } });

/** GET /api/front-office/dashboard */
export function getFrontOfficeDashboard(school_code: string) {
  return api.get('/api/front-office/dashboard', p(school_code));
}

/** GET /api/gate-pass */
export function getGatePassList(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/gate-pass', p(school_code, params));
}

/** POST /api/gate-pass */
export function createGatePass(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/gate-pass', body, p(school_code));
}

/** GET /api/visitors */
export function getVisitors(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/visitors', p(school_code, params));
}

/** POST /api/visitors */
export function createVisitor(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/visitors', body, p(school_code));
}

export const gatePassService = {
  getFrontOfficeDashboard,
  getGatePassList,
  createGatePass,
  getVisitors,
  createVisitor,
};
