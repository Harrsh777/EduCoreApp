/**
 * Marks APIs. Same as web. Tables: student_exam_summary, student_subject_marks, examinations, students, accepted_schools, classes.
 */

import { api } from '@/lib/api';

const p = (school_code: string, extra?: Record<string, unknown>) => ({ params: { school_code, ...extra } });

/** GET /api/marks/view?school_code=&exam_id=&class_id= */
export function getMarksView(school_code: string, params?: { exam_id?: string; class_id?: string }) {
  return api.get('/api/marks/view', p(school_code, params as Record<string, string>));
}

/** GET /api/marks/report-card?school_code= */
export function getReportCard(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/marks/report-card', p(school_code, params));
}

/** GET /api/marks/bulk-download?school_code= */
export function getBulkDownload(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/marks/bulk-download', p(school_code, params));
}

/** GET /api/marks/export?school_code= */
export function getMarksExport(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/marks/export', p(school_code, params));
}

export const marksService = {
  getMarksView,
  getReportCard,
  getBulkDownload,
  getMarksExport,
};
