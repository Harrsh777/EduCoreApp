/**
 * Examinations + Marks APIs. When USE_SUPABASE_DASHBOARD, list from examinations table.
 */

import axios from 'axios';
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
  return fetchStudentExaminationsPayload(school_code, student_id).then((data) => ({ data }));
}

function marksLayerHasExaminations(body: Record<string, unknown>): boolean {
  const layer =
    body?.data && typeof body.data === 'object' && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : body;
  if (!layer || typeof layer !== 'object') return false;
  return (
    'examinations' in layer ||
    'exam_term_structures' in layer ||
    'scheduled_examinations' in layer
  );
}

/**
 * Primary: GET /api/examinations/v2/student. On 404, tries /api/student/examinations, then marks embed.
 */
export async function fetchStudentExaminationsPayload(
  school_code: string,
  student_id: string
): Promise<unknown> {
  const params = { school_code, student_id };
  const paths = ['/api/examinations/v2/student', '/api/student/examinations'] as const;

  for (const url of paths) {
    try {
      const r = await api.get(url, { params });
      return r.data;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) continue;
      throw e;
    }
  }

  try {
    const r = await api.get('/api/student/marks', { params });
    const body = r.data as Record<string, unknown>;
    if (marksLayerHasExaminations(body)) {
      return body.data && typeof body.data === 'object' ? body.data : body;
    }
    return { examinations: [] };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return { examinations: [] };
    }
    throw e;
  }
}

/** GET /api/student/marks — merge with examinations by exam_id for published results. */
export async function fetchStudentMarksPayload(
  school_code: string,
  student_id: string
): Promise<unknown> {
  const r = await api.get('/api/student/marks', {
    params: { school_code, student_id },
  });
  return r.data;
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
  fetchStudentExaminationsPayload,
  fetchStudentMarksPayload,
};
