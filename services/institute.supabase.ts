/**
 * Institute info from Supabase. Table per guide: accepted_schools (school_name, school_code, school_address, city, state, zip_code, country, school_email, school_phone, principal_name, etc.).
 */

import { supabase } from '@/lib/supabase';

/** GET /api/schools/accepted — list accepted schools; filter by school_code if provided */
export async function getAcceptedSchoolsFromSupabase(params?: { school_code?: string }) {
  let q = supabase.from('accepted_schools').select('*');
  if (params?.school_code?.trim()) {
    q = q.eq('school_code', params.school_code.trim());
  }
  const { data, error } = await q;
  if (error) return { data: [] };
  const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
  return { data: list };
}

/** PATCH institute — update accepted_schools row by school_code */
export async function patchInstituteFromSupabase(school_code: string, _path: string, body: Record<string, unknown>) {
  const sc = school_code.trim();
  const { data, error } = await supabase
    .from('accepted_schools')
    .update(body)
    .eq('school_code', sc)
    .select()
    .maybeSingle();
  if (error) throw error;
  return { data };
}

/** GET working-days (optional table institute_working_days) */
export async function getInstituteWorkingDaysFromSupabase(school_code: string) {
  const { data, error } = await supabase
    .from('institute_working_days')
    .select('*')
    .eq('school_code', school_code.trim());
  if (error) return { data: null };
  return { data: data ?? {} };
}

/** GET houses (optional table institute_houses) */
export async function getInstituteHousesFromSupabase(school_code: string) {
  const { data, error } = await supabase
    .from('institute_houses')
    .select('*')
    .eq('school_code', school_code.trim());
  if (error) return { data: [] };
  return { data: data ?? [] };
}
