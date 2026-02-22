/**
 * Communication / Notices from Supabase. Table: notices (id, school_code, title, content, category, priority, status, publish_at, created_at).
 */

import { supabase } from '@/lib/supabase';

export async function getNoticesFromSupabase(
  school_code: string,
  params?: { limit?: number; status?: string; category?: string; priority?: string }
) {
  const sc = school_code.trim();
  let q = supabase.from('notices').select('*').eq('school_code', sc);
  if (params?.status) q = q.eq('status', params.status);
  if (params?.category) q = q.eq('category', params.category);
  if (params?.priority) q = q.eq('priority', params.priority);
  q = q.order('publish_at', { ascending: false });
  if (params?.limit) q = q.limit(params.limit);
  const { data, error } = await q;
  if (error) return { data: [] };
  return { data: data ?? [] };
}
