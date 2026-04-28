/**
 * School dashboard APIs. All require school_code. When USE_SUPABASE_DASHBOARD, data from Supabase.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import {
  createClassFromSupabase,
  createStaffFromSupabase,
  createStudentFromSupabase,
  getClassByExactMatchFromSupabase,
  getClassesFromSupabaseSchool,
  getStaffByIdFromSupabase,
  getStaffFromSupabase,
  getStudentByAdmissionNoFromSupabase,
  getStudentFromSupabase,
  getStudentsFromSupabase,
  updateClassFromSupabase,
  updateStudentFromSupabase,
} from './school.supabase';

const withSchool = (params: Record<string, unknown>, school_code: string) =>
  ({ ...params, school_code });

/** GET /api/dashboard/stats */
export function getDashboardStats(school_code: string) {
  return api.get('/api/dashboard/stats', { params: { school_code } });
}

/** GET /api/students */
export function getStudents(
  school_code: string,
  params?: { class?: string; section?: string; academic_year?: string; search?: string; status?: string }
) {
  if (env.USE_SUPABASE_DASHBOARD) return getStudentsFromSupabase(school_code, params);
  return api.get('/api/students', { params: withSchool(params ?? {}, school_code) });
}

/** GET /api/classes/academic-years?school_code= — diary / class pickers (staff dashboard). */
export function getAcademicYears(school_code: string) {
  return api.get('/api/classes/academic-years', { params: { school_code } });
}

/** Get single class by exact match (school_code, class, section, academic_year). Use when USE_SUPABASE_DASHBOARD. */
export function getClassByExactMatch(school_code: string, classVal: string, section: string, academic_year: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getClassByExactMatchFromSupabase(school_code, classVal, section, academic_year).then((r) => ({ data: r.data }));
  return api.get('/api/classes', { params: { school_code } }).then((res) => {
    const list = (res?.data as { data?: { class?: string; section?: string; academic_year?: string; id?: string }[] })?.data ?? [];
    const found = Array.isArray(list) && list.find((c) => String(c.class) === String(classVal) && String(c.section) === String(section) && (!academic_year || String(c.academic_year) === String(academic_year)));
    return { data: found ?? null };
  });
}

/** Get student by admission_no (for Supabase table auth when profile has no class/section). */
export function getStudentByAdmissionNo(school_code: string, admission_no: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getStudentByAdmissionNoFromSupabase(school_code, admission_no).then((r) => ({ data: r.data }));
  return api.get('/api/students', { params: { school_code, search: admission_no } }).then((res) => {
    const list = (res?.data as { data?: { admission_no?: string }[] })?.data ?? [];
    const found = Array.isArray(list) && list.find((s) => String(s.admission_no) === String(admission_no));
    return { data: found ?? null };
  });
}

/** Get staff by id (e.g. class_teacher_id from class record). REST: GET /api/staff/:id */
export function getStaffById(school_code: string, staff_id: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getStaffByIdFromSupabase(school_code, staff_id).then((r) => ({ data: r.data }));
  return api.get(`/api/staff/${staff_id}`, { params: { school_code } }).then((res) => {
    const body = res.data as { data?: unknown } | null | undefined;
    const staff = body != null && typeof body === 'object' && 'data' in body && body.data != null ? body.data : body;
    return { data: staff };
  });
}

/** GET /api/students/[id] */
export function getStudent(id: string, school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getStudentFromSupabase(id, school_code);
  return api.get(`/api/students/${id}`, { params: { school_code } });
}

/** POST /api/students */
export function createStudent(school_code: string, body: Record<string, unknown>) {
  if (env.USE_SUPABASE_DASHBOARD) return createStudentFromSupabase(school_code, body);
  return api.post('/api/students', body, { params: { school_code } });
}

/** PATCH /api/students/[id] */
export function updateStudent(id: string, school_code: string, body: Record<string, unknown>) {
  if (env.USE_SUPABASE_DASHBOARD) return updateStudentFromSupabase(id, school_code, body);
  return api.patch(`/api/students/${id}`, body, { params: { school_code } });
}

/** GET /api/staff */
export function getStaff(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getStaffFromSupabase(school_code);
  return api.get('/api/staff', { params: { school_code } });
}

/** GET /api/classes */
export function getClasses(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getClassesFromSupabaseSchool(school_code).then((r) => ({ data: r }));
  return api.get('/api/classes', { params: { school_code } });
}

/** GET /api/attendance/class */
export function getAttendanceClass(school_code: string, params: { class_id: string; date?: string }) {
  return api.get('/api/attendance/class', { params: withSchool(params, school_code) });
}

/** Attendance write endpoint varies by deployment (PUT update vs POST mark/update). */
export function updateAttendance(body: {
  school_code: string;
  class_id: string;
  date: string;
  attendance: Array<{ student_id: string; status: string }>;
}) {
  const normalizedBody = {
    ...body,
    attendance: (body.attendance ?? []).map((row) => ({
      ...row,
      status: row.status === 'half_day' ? 'absent' : row.status,
    })),
  };

  return api.put('/api/attendance/update', normalizedBody).catch((error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404 || status === 405) {
      return api.post('/api/attendance/mark', normalizedBody).catch((markError: unknown) => {
        const markStatus = (markError as { response?: { status?: number } })?.response?.status;
        if (markStatus === 400 && normalizedBody.attendance.length > 0) {
          return Promise.all(
            normalizedBody.attendance.map((row) =>
              api.post('/api/attendance/mark', {
                school_code: normalizedBody.school_code,
                class_id: normalizedBody.class_id,
                date: normalizedBody.date,
                student_id: row.student_id,
                status: row.status,
              })
            )
          );
        }
        if (markStatus === 404 || markStatus === 405) {
          return api.post('/api/attendance/update', normalizedBody);
        }
        throw markError;
      });
    }
    throw error;
  });
}

/** GET /api/calendar/academic */
export function getCalendarAcademic(school_code: string) {
  return api.get('/api/calendar/academic', { params: { school_code } });
}

/** GET /api/communication/notices */
export function getNotices(school_code: string, params?: { limit?: number; category?: string; status?: string }) {
  return api.get('/api/communication/notices', { params: withSchool(params ?? {}, school_code) });
}

/** POST /api/staff */
export function createStaff(school_code: string, body: Record<string, unknown>) {
  if (env.USE_SUPABASE_DASHBOARD) return createStaffFromSupabase(school_code, body);
  return api.post('/api/staff', body, { params: { school_code } });
}

/** PATCH /api/staff/[id] */
export function updateStaff(school_code: string, staffId: string, body: Record<string, unknown>) {
  return api.patch(`/api/staff/${staffId}`, body, { params: { school_code } });
}

/** GET /api/staff/photos/self — current staff photo (staff_id in params or from auth) */
export function getStaffPhotoSelf(school_code: string, staff_id: string) {
  return api.get('/api/staff/photos/self', { params: { school_code, staff_id } });
}

/** POST /api/staff/import */
export function importStaff(school_code: string, body: FormData | Record<string, unknown>) {
  const isForm = body instanceof FormData;
  return api.post('/api/staff/import', body, {
    params: { school_code },
    headers: isForm ? undefined : { 'Content-Type': 'application/json' },
  });
}

/** POST /api/staff/photos/bulk */
export function bulkStaffPhotos(school_code: string, body: FormData | Record<string, unknown>) {
  const isForm = body instanceof FormData;
  return api.post('/api/staff/photos/bulk', body, {
    params: { school_code },
    headers: isForm ? undefined : { 'Content-Type': 'application/json' },
  });
}

/** GET /api/attendance/overview */
export function getAttendanceOverview(school_code: string) {
  return api.get('/api/attendance/overview', { params: { school_code } });
}

/** GET /api/attendance/staff */
export function getStaffAttendance(
  school_code: string,
  params: { staff_id?: string; start_date: string; end_date: string }
) {
  return api.get('/api/attendance/staff', { params: withSchool(params, school_code) });
}

/** GET /api/classes/[id]/subjects */
export function getClassSubjects(school_code: string, classId: string) {
  return api.get(`/api/classes/${classId}/subjects`, { params: { school_code } });
}

/** POST /api/classes */
export function createClass(school_code: string, body: Record<string, unknown>) {
  if (env.USE_SUPABASE_DASHBOARD) return createClassFromSupabase(school_code, body);
  return api.post('/api/classes', body, { params: { school_code } });
}

/** PATCH /api/classes/[id] */
export function updateClass(school_code: string, id: string, body: Record<string, unknown>) {
  if (env.USE_SUPABASE_DASHBOARD) return updateClassFromSupabase(id, school_code, body);
  return api.patch(`/api/classes/${id}`, body, { params: { school_code } });
}

/** PATCH /api/classes/[id]/subjects (subject-teacher assignment) */
export function updateClassSubjects(
  school_code: string,
  classId: string,
  body: Record<string, unknown>
) {
  return api.patch(`/api/classes/${classId}/subjects`, body, { params: { school_code } });
}

/** POST /api/students/import */
export function importStudents(school_code: string, body: FormData | Record<string, unknown>) {
  const isForm = body instanceof FormData;
  return api.post('/api/students/import', body, {
    params: { school_code },
    headers: isForm ? undefined : { 'Content-Type': 'application/json' },
  });
}

export const schoolService = {
  getDashboardStats,
  getStudents,
  getAcademicYears,
  getStudent,
  getStudentByAdmissionNo,
  createStudent,
  updateStudent,
  importStudents,
  getStaff,
  getStaffById,
  createStaff,
  importStaff,
  bulkStaffPhotos,
  getClasses,
  getClassByExactMatch,
  createClass,
  updateClass,
  getClassSubjects,
  updateClassSubjects,
  getAttendanceClass,
  getAttendanceOverview,
  getStaffAttendance,
  updateAttendance,
  getCalendarAcademic,
  getNotices,
};
