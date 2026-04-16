   /**
 * Password / login credentials APIs. Same as web.
 */

import { api } from '@/lib/api';

const p = (school_code: string) => ({ params: { school_code } });

/** GET /api/dashboard/login-credentials */
export function getLoginCredentials(school_code: string) {
  return api.get('/api/dashboard/login-credentials', p(school_code));
}

/** POST /api/staff/reset-password */
export function resetStaffPassword(body: {
  school_code: string;
  staff_id: string;
  new_password: string;
}) {
  return api.post('/api/staff/reset-password', body);
}

/** POST /api/students/reset-password (or equivalent) */
export function resetStudentPassword(body: {
  school_code: string;
  admission_no?: string;
  student_id?: string;
  new_password: string;
}) {
  return api.post('/api/students/reset-password', body);
}

/** POST /api/staff/change-password?school_code= */
export function changeStaffPassword(body: {
  school_code: string;
  staff_id: string;
  current_password: string;
  new_password: string;
}) {
  const { school_code, staff_id, current_password, new_password } = body;
  return api.post(
    '/api/staff/change-password',
    { staff_id, current_password, new_password },
    { params: { school_code } }
  );
}

/** POST /api/students/change-password — student change own (current_password, new_password). Same as web. */
export function changeStudentPassword(body: {
  school_code: string;
  student_id: string;
  current_password: string;
  new_password: string;
}) {
  return api.post('/api/students/change-password', body);
}

export const passwordService = {
  getLoginCredentials,
  resetStaffPassword,
  resetStudentPassword,
  changeStaffPassword,
  changeStudentPassword,
};
