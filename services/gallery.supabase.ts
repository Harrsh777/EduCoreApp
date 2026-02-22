/**
 * Gallery from Supabase. Table per guide: gallery (id, school_code, category, image_url, title, description, uploaded_by, is_active, created_at).
 */

import { supabase } from '@/lib/supabase';

export async function getGalleryFromSupabase(school_code: string, category?: string) {
  const sc = school_code.trim();
  let q = supabase.from('gallery').select('*').eq('school_code', sc).eq('is_active', true);
  if (category?.trim()) q = q.eq('category', category.trim());
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) return { data: [] };
  return { data: data ?? [] };
}
