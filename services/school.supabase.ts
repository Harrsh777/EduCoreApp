/**
 * School module from Supabase. Tables per guide: students, staff, classes, staff_login, student_attendance, staff_attendance.
 */

import { supabase } from '@/lib/supabase';

const code = (school_code: string) => school_code.trim();

/** GET /api/students — list students by school_code, optional class/section/academic_year/search */
export async function getStudentsFromSupabase(
  school_code: string,
  params?: { class?: string; section?: string; academic_year?: string; search?: string; status?: string }
) {
  const sc = code(school_code);
  let q = supabase.from('students').select('*').eq('school_code', sc);
  if (params?.class) q = q.eq('class', params.class);
  if (params?.section) q = q.eq('section', params.section);
  if (params?.academic_year) q = q.eq('academic_year', params.academic_year);
  if (params?.status?.trim()) q = q.eq('status', params.status.trim());
  if (params?.search?.trim()) {
    const s = params.search.trim();
    q = q.or(`student_name.ilike.%${s}%,full_name.ilike.%${s}%,admission_no.ilike.%${s}%`);
  }
  const { data, error } = await q.order('admission_no', { ascending: true });
  if (error) return { data: [] };
  return { data: data ?? [] };
}

/** GET /api/students/[id] */
export async function getStudentFromSupabase(id: string, school_code: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .eq('school_code', code(school_code))
    .maybeSingle();
  if (error || !data) return { data: null };
  return { data };
}

/** POST /api/students */
export async function createStudentFromSupabase(school_code: string, body: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('students')
    .insert({ ...body, school_code: code(school_code) })
    .select('id')
    .single();
  if (error) throw error;
  return { data };
}

/** PATCH /api/students/[id] */
export async function updateStudentFromSupabase(id: string, school_code: string, body: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('students')
    .update(body)
    .eq('id', id)
    .eq('school_code', code(school_code))
    .select()
    .single();
  if (error) throw error;
  return { data };
}

/** GET /api/staff */
export async function getStaffFromSupabase(school_code: string) {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('school_code', code(school_code))
    .order('staff_id', { ascending: true });
  if (error) return { data: [] };
  return { data: data ?? [] };
}

/** POST /api/staff */
export async function createStaffFromSupabase(school_code: string, body: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('staff')
    .insert({ ...body, school_code: code(school_code) })
    .select('id')
    .single();
  if (error) throw error;
  return { data };
}

/** GET /api/classes — list with name/class_name for UI (guide: class, section, academic_year, class_teacher_id) */
export async function getClassesFromSupabaseSchool(school_code: string) {
  const sc = code(school_code);
  const { data, error } = await supabase.from('classes').select('*').eq('school_code', sc);
  if (error) return { data: [], sections: 0 };
  const rows = (data ?? []) as Record<string, unknown>[];
  const list = rows.map((r) => ({
    ...r,
    name: r.class ?? r.name ?? r.class_name,
    class_name: r.class ?? r.class_name,
  }));
  const sections = new Set(rows.map((r) => r.section ?? r.section_name)).size;
  return { data: list, sections };
}

/** Get single class by exact match: school_code, class, section, academic_year (correct way, not partial filters) */
export async function getClassByExactMatchFromSupabase(
  school_code: string,
  classVal: string,
  section: string,
  academic_year: string
) {
  const sc = code(school_code);
  const cls = String(classVal ?? '').trim();
  const sec = String(section ?? '').trim();
  const ay = String(academic_year ?? '').trim();
  if (!sc || !cls || !sec) return { data: null };
  let q = supabase.from('classes').select('*').eq('school_code', sc).eq('class', cls).eq('section', sec);
  if (ay) q = q.eq('academic_year', ay);
  const { data, error } = await q.maybeSingle();
  if (error) return { data: null };
  return { data: data as Record<string, unknown> | null };
}

/** Get student by admission_no + school_code (for Supabase table auth when profile has no class/section) */
export async function getStudentByAdmissionNoFromSupabase(school_code: string, admission_no: string) {
  const sc = code(school_code);
  const adm = String(admission_no ?? '').trim();
  if (!sc || !adm) return { data: null };
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_code', sc)
    .eq('admission_no', adm)
    .maybeSingle();
  if (error || !data) return { data: null };
  return { data: data as Record<string, unknown> };
}

/** Get staff by id (for class teacher) */
export async function getStaffByIdFromSupabase(school_code: string, staff_id: string) {
  const sc = code(school_code);
  const id = String(staff_id ?? '').trim();
  if (!sc || !id) return { data: null };
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('school_code', sc)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return { data: null };
  return { data: data as Record<string, unknown> };
}

/** POST /api/classes */
export async function createClassFromSupabase(school_code: string, body: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('classes')
    .insert({ ...body, school_code: code(school_code) })
    .select('id')
    .single();
  if (error) throw error;
  return { data };
}

/** PATCH /api/classes/[id] */
export async function updateClassFromSupabase(id: string, school_code: string, body: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('classes')
    .update(body)
    .eq('id', id)
    .eq('school_code', code(school_code))
    .select()
    .single();
  if (error) throw error;
  return { data };
}
