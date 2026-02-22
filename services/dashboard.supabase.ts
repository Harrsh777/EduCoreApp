/**
 * Dashboard data from Supabase. Tables per School Admin Dashboard guide:
 * accepted_schools, students, staff, student_attendance, staff_attendance, payments, classes.
 */

import { supabase } from '@/lib/supabase';

export async function getDashboardStatsFromSupabase(school_code: string): Promise<Record<string, unknown>> {
  const code = school_code.trim();
  const count = async (table: string): Promise<number> => {
    const { count: n, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('school_code', code);
    return error ? 0 : (n ?? 0);
  };
  const studentsCount = await count('students').catch(() => 0);
  const staffCount = await count('staff').catch(() => 0);
  const staffLoginCount = await count('staff_login').catch(() => 0);
  const totalStaff = staffCount || staffLoginCount;
  const classesCount = await count('classes').catch(() => 0);
  return {
    total_students: studentsCount,
    totalStudents: studentsCount,
    students: studentsCount,
    total_staff: totalStaff,
    totalStaff,
    staff: totalStaff,
    classes: classesCount,
    school_code: code,
  };
}

export async function getDashboardStatsDetailedFromSupabase(school_code: string): Promise<Record<string, unknown>> {
  const stats = await getDashboardStatsFromSupabase(school_code);
  return {
    ...stats,
    staff_attendance_pct: null,
    staff_attendance: '—',
  };
}

/** Classes table per guide: id, school_code, class, section, academic_year, class_teacher_id. Return shape: { data, sections } with name/class_name for UI. */
export async function getClassesFromSupabase(school_code: string): Promise<unknown> {
  const code = school_code.trim();
  const tryTable = async (table: string) => {
    const { data, error } = await supabase.from(table).select('*').eq('school_code', code);
    return { data, error };
  };
  let result = await tryTable('classes');
  if (result.error) result = await tryTable('class');
  if (result.error) return { data: [], sections: 0 };
  const rows = (result.data ?? []) as Record<string, unknown>[];
  const list = rows.map((r) => ({
    ...r,
    name: r.class ?? r.name ?? r.class_name,
    class_name: r.class ?? r.class_name,
  }));
  const sections = new Set(list.map((r) => r.section ?? r.section_name ?? r.section_id)).size;
  return { data: list, sections };
}

/** Per guide: payments (or fees) — monthly collection. Columns: amount, payment_date (or paid_at, collected_at). */
export async function getFinancialOverviewFromSupabase(school_code: string): Promise<Record<string, unknown>> {
  const code = school_code.trim();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

  const tryTable = async (table: string, dateCol: string) => {
    const { data, error } = await supabase.from(table).select(`amount, ${dateCol}`).eq('school_code', code);
    return { data, error };
  };
  let result = await tryTable('payments', 'payment_date');
  if (result.error) result = await tryTable('fee_collections', 'paid_at');
  if (result.error) result = await tryTable('fee_collections', 'collected_at');
  if (result.error) result = await tryTable('fees', 'payment_date');
  if (result.error) return { monthly_collection: 0, monthlyCollection: 0, collected: 0, total_collected: 0 };

  const rows = (result.data ?? []) as Record<string, unknown>[];
  const dateKey = rows[0] && ('payment_date' in rows[0] ? 'payment_date' : 'collected_at' in rows[0] ? 'collected_at' : 'paid_at');
  const total = rows.reduce((sum: number, r: Record<string, unknown>) => {
    const d = r[dateKey as string];
    if (d == null) return sum;
    const t = new Date(d as string).getTime();
    if (t >= startOfMonth && t <= endOfMonth) return sum + (Number(r.amount) ?? 0);
    return sum;
  }, 0);
  return { monthly_collection: total, monthlyCollection: total, collected: total, total_collected: total };
}
