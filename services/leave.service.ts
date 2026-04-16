/**
 * Leave APIs. When USE_SUPABASE_DASHBOARD, data from leave_types.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getLeaveTypesFromSupabase } from './leave.supabase';

/** GET /api/leave/types */
export function getLeaveTypes(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getLeaveTypesFromSupabase(school_code);
  return api.get('/api/leave/types', { params: { school_code } });
}

/** GET /api/leave/requests (staff) */
export function getStaffLeaveRequests(school_code: string, params?: { staff_id?: string }) {
  return api.get('/api/leave/requests', { params: { school_code, ...params } });
}

/** POST /api/leave/requests (staff apply) */
export function postStaffLeaveRequest(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/leave/requests', body, { params: { school_code } });
}

/** POST /api/leave/requests/:id/withdraw */
export function withdrawStaffLeaveRequest(school_code: string, requestId: string) {
  return api.post(`/api/leave/requests/${requestId}/withdraw`, {}, { params: { school_code } });
}

/** GET /api/leave/student-requests (for teacher: class-teacher pending) */
export function getStudentLeaveRequestsClassTeacher(school_code: string, staff_id: string) {
  return api.get('/api/leave/student-requests/class-teacher', { params: { school_code, staff_id } });
}

/** PATCH /api/leave/student-requests/[id]/class-teacher-approval */
export function patchStudentLeaveApproval(
  school_code: string,
  requestId: string,
  body: { status: string; remarks?: string }
) {
  return api.patch(`/api/leave/student-requests/${requestId}/class-teacher-approval`, body, { params: { school_code } });
}

/** GET /api/leave/student-requests (student's own) */
export function getStudentLeaveRequests(school_code: string, student_id: string) {
  return api.get('/api/leave/student-requests', { params: { school_code, student_id } });
}

/** POST /api/leave/student-requests */
export function postStudentLeaveRequest(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/leave/student-requests', body, { params: { school_code } });
}

export const leaveService = {
  getLeaveTypes,
  getStaffLeaveRequests,
  postStaffLeaveRequest,
  withdrawStaffLeaveRequest,
  getStudentLeaveRequestsClassTeacher,
  patchStudentLeaveApproval,
  getStudentLeaveRequests,
  postStudentLeaveRequest,
};
