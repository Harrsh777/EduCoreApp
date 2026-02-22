/**
 * Calendar from Supabase. Tables: academic_calendar, events (school_code, event_date, title, description, event_type, applicable_for, applicable_classes).
 */

import { supabase } from '@/lib/supabase';

export async function getCalendarAcademicFromSupabase(school_code: string, academic_year?: string) {
  const sc = school_code.trim();
  let q = supabase.from('academic_calendar').select('*').eq('school_code', sc);
  if (academic_year) q = q.eq('academic_year', academic_year);
  const { data, error } = await q;
  if (error) return { data: [] };
  return { data: data ?? [] };
}

export async function getCalendarEventsFromSupabase(
  school_code: string,
  params?: { start?: string; end?: string }
) {
  const sc = school_code.trim();
  let q = supabase.from('events').select('*').eq('school_code', sc);
  if (params?.start) q = q.gte('event_date', params.start);
  if (params?.end) q = q.lte('event_date', params.end);
  const { data, error } = await q.order('event_date', { ascending: true });
  if (error) return { data: [] };
  return { data: data ?? [] };
}
