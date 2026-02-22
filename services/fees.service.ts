/**
 * Fees APIs. When USE_SUPABASE_DASHBOARD, data from fee_heads and payments.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getFeeHeadsFromSupabase, getPaymentsFromSupabase } from './fees.supabase';

/** GET /api/fees/v2/fee-heads */
export function getFeeHeads(school_code: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getFeeHeadsFromSupabase(school_code);
  return api.get('/api/fees/v2/fee-heads', { params: { school_code } });
}

/** GET /api/fees/v2/fee-structures */
export function getFeeStructures(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/fees/v2/fee-structures', { params: { school_code, ...params } });
}

/** GET /api/fees/v2/payments */
export function getPayments(school_code: string, params?: Record<string, unknown>) {
  if (env.USE_SUPABASE_DASHBOARD) return getPaymentsFromSupabase(school_code, params as { limit?: number; student_id?: string });
  return api.get('/api/fees/v2/payments', { params: { school_code, ...params } });
}

/** GET /api/fees/receipts */
export function getReceipts(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/fees/receipts', { params: { school_code, ...params } });
}

/** GET /api/fees/students (or fee-structure students) */
export function getFeeStudents(school_code: string, params?: Record<string, unknown>) {
  return api.get('/api/fees/students', { params: { school_code, ...params } });
}

/** POST /api/fees/v2/payments */
export function createPayment(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/fees/v2/payments', body, { params: { school_code } });
}

/** GET /api/fees/receipts/[id]/download or similar - receipt download (blob) */
export function downloadReceipt(school_code: string, receiptId: string) {
  return api.get(`/api/fees/receipts/${receiptId}/download`, { params: { school_code }, responseType: 'blob' });
}

/** GET /api/fees/receipts/[id]/view or /url - returns { url } for opening in browser */
export function getReceiptViewUrl(school_code: string, receiptId: string) {
  return api.get<{ url?: string }>(`/api/fees/receipts/${receiptId}/view`, { params: { school_code } });
}

export const feesService = {
  getFeeHeads,
  getFeeStructures,
  getPayments,
  createPayment,
  getReceipts,
  getFeeStudents,
  downloadReceipt,
  getReceiptViewUrl,
};
