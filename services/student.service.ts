/**
 * Student service: student-scoped API calls.
 * Matches Student Dashboard – In-Depth Guide & Mobile API Reference.
 * All requests go through lib/api. 401 → logout (handled in lib/api).
 */

import { api } from '@/lib/api';

type Query = { school_code: string; class?: string; section?: string; search?: string };

export const studentService = {
  list(params: Query) {
    return api.get('/api/students', { params });
  },

  getById(id: string, school_code: string) {
    return api.get(`/api/students/${id}`, { params: { school_code } });
  },

  /** GET /api/student/attendance — legacy path (some backends) */
  getAttendance(params: { school_code: string; student_id: string; start_date?: string; end_date?: string }) {
    return api.get('/api/student/attendance', { params });
  },

  /** GET /api/attendance/student — doc path; dates YYYY-MM-DD */
  getAttendanceStudent(params: { school_code: string; student_id: string; start_date: string; end_date: string }) {
    return api.get('/api/attendance/student', { params });
  },

  getMarks(params: { school_code: string; student_id: string }) {
    return api.get('/api/student/marks', { params });
  },

  getFees(params: { school_code: string; student_id: string }) {
    return api.get('/api/student/fees', { params });
  },

  getTransport(params: { school_code: string; student_id: string }) {
    return api.get('/api/student/transport', { params });
  },

  getStats(params: { school_code: string; student_id: string }) {
    return api.get('/api/student/stats', { params });
  },

  getUpcomingItems(params: { school_code: string; student_id: string; limit?: number }) {
    return api.get('/api/student/upcoming-items', { params });
  },

  getWeeklyCompletion(params: { school_code: string; student_id: string }) {
    return api.get('/api/student/weekly-completion', { params });
  },

  getClassTeacher(params: { school_code: string; class: string; section: string; academic_year: string }) {
    return api.get('/api/student/class-teacher', { params });
  },

  getClassmates(params: { school_code: string; class: string; section: string; academic_year?: string }) {
    return api.get('/api/student/classmates', { params });
  },

  getFeeReceipts(params: { school_code: string; student_id: string }) {
    return api.get('/api/student/fees/receipts', { params });
  },

  getParent(params: { school_code: string; student_id: string }) {
    return api.get('/api/student/parent', { params });
  },

  /** GET /api/student/copy-checking — teacher copy-checking records for this student */
  getCopyChecking(params: { school_code: string; student_id: string }) {
    return api.get('/api/student/copy-checking', { params });
  },

  /** GET /api/student/diary — diary entries for student's class; params include class, section, academic_year */
  getDiary(params: { school_code: string; student_id: string; class: string; section: string; academic_year: string }) {
    return api.get('/api/student/diary', { params });
  },

  /** POST /api/diary/:diaryId/read — mark diary entry as read; body: { user_id, user_type: 'STUDENT' } */
  markDiaryRead(diaryId: string, body: { user_id: string; user_type: 'STUDENT' }) {
    return api.post(`/api/diary/${diaryId}/read`, body);
  },

  /** GET /api/student/certificates — list certificates (bonafide, conduct, etc.) */
  getCertificates(params: { school_code: string; student_id: string }) {
    return api.get('/api/student/certificates', { params });
  },

  /** GET /api/student/library — books + borrowed_books for student */
  getLibrary(params: { school_code: string; student_id: string }) {
    return api.get('/api/student/library', { params });
  },

  /** GET /api/marks/report-card/student — list report cards for student */
  getReportCardList(params: { school_code: string; student_id: string }) {
    return api.get('/api/marks/report-card/student', { params });
  },

  /** GET /api/marks/report-card/:id — view/download report card; pass student_id in query for auth */
  getReportCardDocument(reportCardId: string, params: { student_id: string; school_code?: string }) {
    return api.get(`/api/marks/report-card/${reportCardId}`, { params });
  },

  /** GET /api/fees/receipts/:paymentId/download — receipt PDF/file; use responseType: 'blob' if needed */
  getFeeReceiptDownload(paymentId: string, school_code: string) {
    return api.get(`/api/fees/receipts/${paymentId}/download`, { params: { school_code } });
  },
};
