/**
 * Digital Diary / Homework from Supabase. Tables: diaries, diary_targets, diary_attachments, diary_reads.
 */

import { supabase } from '@/lib/supabase';

export async function getDiaryFromSupabase(
  school_code: string,
  params?: { academic_year_id?: string; type?: string; page?: number; limit?: number }
) {
  let q = supabase.from('diaries').select('*').eq('school_code', school_code.trim()).eq('is_active', true);
  if (params?.academic_year_id) q = q.eq('academic_year_id', params.academic_year_id);
  if (params?.type) q = q.eq('type', params.type);
  q = q.order('created_at', { ascending: false });
  if (params?.limit) q = q.limit(params.limit);
  if (params?.page != null && params?.limit) q = q.range(params.page * params.limit, (params.page + 1) * params.limit - 1);
  const { data, error } = await q;
  if (error) return { data: [] };
  return { data: data ?? [] };
}
