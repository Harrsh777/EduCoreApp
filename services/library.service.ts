/**
 * Library APIs. When USE_SUPABASE_DASHBOARD, data from library_books.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getBooksFromSupabase } from './library.supabase';

/** GET /api/library/books */
export function getBooks(school_code: string, params?: Record<string, unknown>) {
  if (env.USE_SUPABASE_DASHBOARD) return getBooksFromSupabase(school_code, params as { search?: string; section_id?: string });
  return api.get('/api/library/books', { params: { school_code, ...params } });
}

/** POST /api/library/transactions (issue) */
export function createTransaction(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/library/transactions', body, { params: { school_code } });
}

/** POST /api/library/transactions/[id]/return */
export function returnTransaction(school_code: string, transactionId: string) {
  return api.post(`/api/library/transactions/${transactionId}/return`, {}, { params: { school_code } });
}

/** GET /api/library/sections?school_code= */
export function getSections(school_code: string) {
  return api.get('/api/library/sections', { params: { school_code } });
}

/** GET /api/library/transactions?school_code= */
export function getTransactions(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/library/transactions', { params: { school_code, ...params } });
}

/** GET /api/library/transactions or borrower check — student-scoped (borrower_type=student, borrower_id=student_id) */
export function getBorrowerTransactions(
  school_code: string,
  params: { borrower_type: string; borrower_id: string }
) {
  return api.get('/api/library/transactions', { params: { school_code, ...params } });
}

export const libraryService = {
  getBooks,
  createTransaction,
  returnTransaction,
  getSections,
  getTransactions,
  getBorrowerTransactions,
};
