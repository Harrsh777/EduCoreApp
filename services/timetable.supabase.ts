/**
 * Timetable from Supabase. Tables: timetable_period_groups, timetable_slots (school_code, class_id, day_of_week, period_order, subject_id, staff_id, room).
 */

import { supabase } from '@/lib/supabase';

/** List classes with has_timetable and slot_count (from timetable_slots grouped by class_id). */
export async function getTimetableListFromSupabase(school_code: string) {
  const sc = school_code.trim();
  const { data: slots, error } = await supabase
    .from('timetable_slots')
    .select('class_id')
    .eq('school_code', sc);
  if (error) return [];
  const byClass = (slots ?? []).reduce((acc: Record<string, number>, r: { class_id?: string }) => {
    const id = r.class_id ?? 'unknown';
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(byClass).map(([class_id, slot_count]) => ({
    class_id,
    has_timetable: true,
    slot_count,
  }));
}
