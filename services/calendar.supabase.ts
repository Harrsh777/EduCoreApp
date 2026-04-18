/**
 * Calendar from Supabase. Tables: academic_calendar, events (school_code, event_date, title, description, event_type, applicable_for, applicable_classes).
 */

import { supabase } from '@/lib/supabase';

export type CalendarAcademicSupabaseOptions = {
  academic_year?: string;
  include_events?: boolean;
};

/** Map academic_year query param to event_date bounds (calendar + common "YYYY-YY" session). */
function eventDateRangeForFilter(academic_year?: string): { start: string; end: string } | undefined {
  const raw = academic_year?.trim();
  if (!raw) return undefined;
  if (/^\d{4}$/.test(raw)) {
    return { start: `${raw}-01-01`, end: `${raw}-12-31` };
  }
  const m = raw.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const y1 = m[1];
    const y2s = parseInt(m[2], 10);
    const y2Full = y2s < 50 ? 2000 + y2s : 1900 + y2s;
    return { start: `${y1}-04-01`, end: `${y2Full}-03-31` };
  }
  return undefined;
}

export async function getCalendarAcademicFromSupabase(
  school_code: string,
  options?: CalendarAcademicSupabaseOptions
) {
  const sc = school_code.trim();
  const academic_year = options?.academic_year;
  const include_events = options?.include_events === true;

  let q = supabase.from('academic_calendar').select('*').eq('school_code', sc);
  if (academic_year) q = q.eq('academic_year', academic_year);
  const { data, error } = await q;
  if (error) return { data: [] };

  const academicRows = data ?? [];
  if (!include_events) {
    return { data: academicRows };
  }

  let range = eventDateRangeForFilter(academic_year);
  if (!range) {
    range = eventDateRangeForFilter(String(new Date().getFullYear()));
  }

  const { data: eventRows } = await getCalendarEventsFromSupabase(sc, range);
  return { data: [...academicRows, ...(eventRows ?? [])] };
}

export async function getCalendarEventsFromSupabase(
  school_code: string,
  params?: { start?: string; end?: string }
) {
  const sc = school_code.trim();
  let q = supabase.from('events').select('*').eq('school_code', sc).eq('is_active', true);
  if (params?.start) q = q.gte('event_date', params.start);
  if (params?.end) q = q.lte('event_date', params.end);
  const { data, error } = await q.order('event_date', { ascending: true });
  if (error) return { data: [] };
  return { data: data ?? [] };
}
