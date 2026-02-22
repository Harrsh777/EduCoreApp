/**
 * Attendance APIs. Tables: student_attendance, staff_attendance, classes, staff, students.
 */

import { api } from '@/lib/api';

const p = (school_code: string, extra?: Record<string, string>) => ({ params: { school_code, ...extra } });

/** GET /api/attendance/overview?school_code= — student + staff summary */
export function getAttendanceOverview(school_code: string) {
  return api.get('/api/attendance/overview', p(school_code));
}

/** GET /api/attendance/staff?school_code=&staff_id=&start_date=&end_date= */
export function getStaffAttendance(
  school_code: string,
  params: { staff_id?: string; start_date: string; end_date: string }
) {
  return api.get('/api/attendance/staff', p(school_code, params));
}

/** GET /api/attendance/staff-monthly?school_code= (if used) */
export function getStaffAttendanceMonthly(school_code: string, params?: Record<string, string>) {
  return api.get('/api/attendance/staff-monthly', p(school_code, params ?? {}));
}

export const attendanceService = {
  getAttendanceOverview,
  getStaffAttendance,
  getStaffAttendanceMonthly,
};
