/**
 * Examinations from Supabase. Tables: examinations (id, exam_name, academic_year, status, school_code, start_date, end_date).
 */

import { supabase } from '@/lib/supabase';

export async function getExaminationsListFromSupabase(school_code: string) {
  const { data, error } = await supabase
    .from('examinations')
    .select('*')
    .eq('school_code', school_code.trim())
    .order('start_date', { ascending: false });
  if (error) return { data: [] };
  return { data: data ?? [] };
}
