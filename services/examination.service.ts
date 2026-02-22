/**
 * Examinations + Marks APIs. When USE_SUPABASE_DASHBOARD, list from examinations table.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getExaminationsListFromSupabase } from './examination.supabase';

/** GET /api/examinations/v2/list */
export function getExaminationsList(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getExaminationsListFromSupabase(school_code);
  return api.get('/api/examinations/v2/list', { params: { school_code } });
}

/** POST /api/examinations/v2/create */
export function createExamination(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/examinations/v2/create', body, { params: { school_code } });
}

/** GET /api/examinations/marks */
export function getExaminationMarks(
  school_code: string,
  params: { exam_id: string; class_id?: string; subject_id?: string }
) {
  return api.get('/api/examinations/marks', { params: { ...params, school_code } });
}

/** POST /api/examinations/marks/submit */
export function submitMarks(school_code: string, body: { exam_id: string; marks: Array<Record<string, unknown>> }) {
  return api.post('/api/examinations/marks/submit', body, { params: { school_code } });
}

/** POST /api/examinations/marks/approve */
export function approveMarks(school_code: string, body: { exam_id: string; [key: string]: unknown }) {
  return api.post('/api/examinations/marks/approve', body, { params: { school_code } });
}

/** GET /api/examinations/marks/status?school_code= */
export function getMarksStatus(school_code: string, params?: { exam_id?: string; class_id?: string }) {
  return api.get('/api/examinations/marks/status', { params: { school_code, ...params } });
}

/** GET /api/examinations?school_code=&status=upcoming — for count / list */
export function getExaminations(school_code: string, params?: { status?: string }) {
  return api.get('/api/examinations', { params: { school_code, ...params } });
}

/** GET /api/examinations/v2/student?school_code=&student_id= — schedules with subject, date */
export function getExaminationsStudent(school_code: string, student_id: string) {
  return api.get('/api/examinations/v2/student', { params: { school_code, student_id } });
}

export const examinationService = {
  getExaminationsList,
  createExamination,
  getExaminationMarks,
  submitMarks,
  approveMarks,
  getMarksStatus,
  getExaminations,
  getExaminationsStudent,
};
