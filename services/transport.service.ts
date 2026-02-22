/**
 * Transport APIs. When USE_SUPABASE_DASHBOARD, data from transport_routes.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getRoutesFromSupabase } from './transport.supabase';

/** GET /api/transport/routes */
export function getRoutes(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getRoutesFromSupabase(school_code);
  return api.get('/api/transport/routes', { params: { school_code } });
}

/** GET /api/transport/stops */
export function getStops(school_code: string) {
  return api.get('/api/transport/stops', { params: { school_code } });
}

/** GET /api/transport/vehicles */
export function getVehicles(school_code: string) {
  return api.get('/api/transport/vehicles', { params: { school_code } });
}

/** GET /api/transport/students (route-students) */
export function getTransportStudents(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/transport/students', { params: { school_code, ...params } });
}

export const transportService = {
  getRoutes,
  getStops,
  getVehicles,
  getTransportStudents,
};
