/**
 * Fees from Supabase. Tables: fee_heads, fee_structures, payments (school_code, student_id, amount, payment_date, payment_mode, receipt_number).
 */

import { supabase } from '@/lib/supabase';

export async function getFeeHeadsFromSupabase(school_code: string) {
  const { data, error } = await supabase
    .from('fee_heads')
    .select('*')
    .eq('school_code', school_code.trim())
    .order('name');
  if (error) return { data: [] };
  return { data: data ?? [] };
}

export async function getPaymentsFromSupabase(school_code: string, params?: { limit?: number; student_id?: string }) {
  let q = supabase.from('payments').select('*').eq('school_code', school_code.trim()).order('payment_date', { ascending: false });
  if (params?.student_id) q = q.eq('student_id', params.student_id);
  if (params?.limit) q = q.limit(params.limit);
  const { data, error } = await q;
  if (error) return { data: [] };
  return { data: data ?? [] };
}
