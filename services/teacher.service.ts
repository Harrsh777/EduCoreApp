/**
 * Teacher service: teacher-scoped API calls.
 * All requests go through lib/api. Pass school_code and teacher_id where required.
 * Staff menu: GET /api/staff/[id]/menu (id = staff UUID) — returns modules/sub_modules for sidebar.
 */

import { api } from '@/lib/api';

type SchoolTeacher = { school_code: string; teacher_id: string };

/** Unwrap common API shapes for GET /api/attendance/staff */
/** True if teaching-assignments response has at least one assignment (web menu gating). */
export function hasTeachingAssignmentsData(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const o = body as Record<string, unknown>;
  const data = o.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const a = (data as { assignments?: unknown }).assignments;
    if (Array.isArray(a) && a.length > 0) return true;
  }
  if (Array.isArray(o.assignments) && o.assignments.length > 0) return true;
  return false;
}

export function normalizeStaffAttendanceList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object') return [];
  const o = body as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data as unknown[];
  if (Array.isArray(o.attendance)) return o.attendance;
  if (Array.isArray(o.records)) return o.records;
  if (Array.isArray(o.rows)) return o.rows;
  if (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) {
    const d = o.data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.attendance)) return d.attendance;
    if (Array.isArray(d.records)) return d.records;
  }
  return [];
}

/** Response shape from GET /api/staff/[id]/menu */
export type StaffMenuSubModule = {
  name: string;
  key: string;
  route: string;
  has_view_access: boolean;
  has_edit_access: boolean;
};

export type StaffMenuModule = {
  module_name: string;
  module_key: string;
  display_order?: number;
  sub_modules: StaffMenuSubModule[];
};

export const teacherService = {
  /** GET /api/staff/[id]/menu — modules and sub_modules with teacher routes (view/edit). */
  getStaffMenu(staffId: string) {
    return api.get<{ data: StaffMenuModule[] }>(`/api/staff/${staffId}/menu`);
  },

  /** GET /api/classes/teacher — pass array=true (web parity) when backend expects an array in data. */
  getClasses(params: SchoolTeacher & { staff_id?: string; array?: boolean }) {
    const q: Record<string, unknown> = {
      school_code: params.school_code,
      teacher_id: params.teacher_id,
      staff_id: params.staff_id,
    };
    if (params.array) q.array = true;
    return api.get('/api/classes/teacher', { params: q });
  },

  getGradeDistribution(params: SchoolTeacher) {
    return api.get('/api/teacher/grade-distribution', { params });
  },

  getStaffSubjects(school_code: string, teacherId: string) {
    return api.get(`/api/staff-subjects/${teacherId}`, { params: { school_code } });
  },

  getTodos(params: SchoolTeacher & { status?: string }) {
    return api.get('/api/teacher/todos', { params });
  },

  createTodo(body: { school_code: string; teacher_id: string; title: string; status?: string; due_date?: string }) {
    return api.post('/api/teacher/todos', body);
  },

  updateTodo(id: string, body: { status?: string; title?: string; due_date?: string }) {
    return api.patch(`/api/teacher/todos/${id}`, body);
  },

  deleteTodo(id: string) {
    return api.delete(`/api/teacher/todos/${id}`);
  },

  getDailyAgenda(params: SchoolTeacher & { staff_id?: string }) {
    return api.get('/api/timetable/daily-agenda', { params });
  },

  /** GET /api/examinations/v2/teacher */
  getExams(params: SchoolTeacher & { exam_type?: string; staff_id?: string }) {
    return api.get('/api/examinations/v2/teacher', { params });
  },

  /** GET /api/teachers/teaching-assignments — non-empty `data.assignments` ⇒ subject teacher (marks entry eligibility). */
  getTeachingAssignments(params: { school_code: string; teacher_id: string }) {
    return api.get('/api/teachers/teaching-assignments', { params });
  },

  /** GET /api/attendance/staff — `staff_id` must be the staff row UUID (same as teacher.id), not the employee code. */
  getAttendance(params: SchoolTeacher & { staff_id?: string; start_date?: string; end_date?: string }) {
    const staffUuid = params.teacher_id?.trim() || params.staff_id?.trim() || '';
    return api
      .get('/api/attendance/staff', {
        params: {
          school_code: params.school_code,
          staff_id: staffUuid,
          start_date: params.start_date,
          end_date: params.end_date,
        },
      })
      .then((res) => {
        const list = normalizeStaffAttendanceList(res.data);
        return { ...res, data: list };
      });
  },

  getClassAttendance(params: { school_code: string; class_id: string; date?: string }) {
    return api.get('/api/attendance/class', { params });
  },

  updateAttendance(body: { school_code: string; class_id: string; date: string; attendance: Array<{ student_id: string; status: string }> }) {
    const normalizedBody = {
      ...body,
      attendance: (body.attendance ?? []).map((row) => ({
        ...row,
        // Student attendance endpoints on some deployments accept only present/absent.
        status: row.status === 'half_day' ? 'absent' : row.status,
      })),
    };

    return api.put('/api/attendance/update', normalizedBody).catch((error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      // Some deployments expose mark/update via POST instead of PUT.
      if (status === 404 || status === 405) {
        return api.post('/api/attendance/mark', normalizedBody).catch((markError: unknown) => {
          const markStatus = (markError as { response?: { status?: number } })?.response?.status;
          // Some backends accept only one student per /mark request.
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
  },
};
