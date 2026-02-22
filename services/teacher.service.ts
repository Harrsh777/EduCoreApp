/**
 * Teacher service: teacher-scoped API calls.
 * All requests go through lib/api. Pass school_code and teacher_id where required.
 * Staff menu: GET /api/staff/[id]/menu (id = staff UUID) — returns modules/sub_modules for sidebar.
 */

import { api } from '@/lib/api';

type SchoolTeacher = { school_code: string; teacher_id: string };

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

  getClasses(params: SchoolTeacher & { staff_id?: string }) {
    return api.get('/api/classes/teacher', { params: { school_code: params.school_code, teacher_id: params.teacher_id, staff_id: params.staff_id } });
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

  getDailyAgenda(params: SchoolTeacher) {
    return api.get('/api/timetable/daily-agenda', { params });
  },

  getExams(params: SchoolTeacher) {
    return api.get('/api/examinations/v2/teacher', { params });
  },

  getAttendance(params: SchoolTeacher & { staff_id?: string; start_date?: string; end_date?: string }) {
    return api.get('/api/attendance/staff', { params: { school_code: params.school_code, staff_id: params.staff_id ?? params.teacher_id, teacher_id: params.teacher_id, start_date: params.start_date, end_date: params.end_date } });
  },

  getClassAttendance(params: { school_code: string; class_id: string; date?: string }) {
    return api.get('/api/attendance/class', { params });
  },

  updateAttendance(body: { school_code: string; class_id: string; date: string; attendance: Array<{ student_id: string; status: string }> }) {
    return api.post('/api/attendance/update', body);
  },
};
