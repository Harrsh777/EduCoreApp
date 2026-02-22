/**
 * Leave dashboard summary API. When USE_SUPABASE_DASHBOARD, data from leave_types and leave_requests.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getLeaveDashboardSummaryFromSupabase } from './leave.supabase';

/** GET /api/leave/dashboard-summary */
export function getLeaveDashboardSummary(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getLeaveDashboardSummaryFromSupabase(school_code);
  return api.get('/api/leave/dashboard-summary', { params: { school_code } });
}

/** GET /api/leave/requests (staff list) */
export function getLeaveRequests(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/leave/requests', { params: { school_code, ...params } });
}

/** GET /api/leave/student-requests */
export function getStudentLeaveRequests(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/leave/student-requests', { params: { school_code, ...params } });
}

/** PATCH /api/leave/requests/[id] (approve/reject) */
export function patchLeaveRequest(school_code: string, id: string, body: Record<string, unknown>) {
  return api.patch(`/api/leave/requests/${id}`, body, { params: { school_code } });
}

export const leaveDashboardService = {
  getLeaveDashboardSummary,
  getLeaveRequests,
  getStudentLeaveRequests,
  patchLeaveRequest,
};
