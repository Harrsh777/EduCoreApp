/**
 * Reports APIs. Same as web.
 */

import { api } from '@/lib/api';

const p = (school_code: string, extra?: Record<string, unknown>) => ({ params: { school_code, ...extra } });

export function getReportStudent(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/reports/student', p(school_code, params));
}

export function getReportStaff(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/reports/staff', p(school_code, params));
}

export function getReportMarks(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/reports/marks', p(school_code, params));
}

export function getReportFinancial(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/reports/financial', p(school_code, params));
}

export function getReportExamination(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/reports/examination', p(school_code, params));
}

export function getReportLeave(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/reports/leave', p(school_code, params));
}

export function getReportTransport(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/reports/transport', p(school_code, params));
}

export function getReportLibrary(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/reports/library', p(school_code, params));
}

export const reportsService = {
  getReportStudent,
  getReportStaff,
  getReportMarks,
  getReportFinancial,
  getReportExamination,
  getReportLeave,
  getReportTransport,
  getReportLibrary,
};
