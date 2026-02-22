/**
 * Library from Supabase. Tables: library_books, library_book_copies, library_sections, library_material_types, library_transactions.
 */

import { supabase } from '@/lib/supabase';

export async function getBooksFromSupabase(school_code: string, params?: { search?: string; section_id?: string }) {
  let q = supabase.from('library_books').select('*').eq('school_code', school_code.trim());
  if (params?.section_id) q = q.eq('section_id', params.section_id);
  if (params?.search?.trim()) q = q.or(`title.ilike.%${params.search.trim()}%,author.ilike.%${params.search.trim()}%`);
  const { data, error } = await q.order('title');
  if (error) return { data: [] };
  return { data: data ?? [] };
}
