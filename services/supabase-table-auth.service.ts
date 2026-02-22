/**
 * Supabase table-based auth: validate against accepted_schools, staff_login, student_login.
 * - Admin: accepted_schools (school_code, password)
 * - Staff: staff_login (school_code, staff_id, plain_password)
 * - Student: student_login (school_code, admission_no, plain_password)
 * For hashed passwords only, use a Supabase RPC to verify server-side.
 */

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/auth-store';

export type SessionPayload = {
  session_token: string;
  role: 'admin' | 'teacher' | 'student';
  school_code: string;
  user_id?: string;
  profile?: Profile | null;
};

function makeToken(prefix: string, id: string): string {
  return `supabase-table-${prefix}-${id}-${Date.now()}`;
}

export const supabaseTableAuthService = {
  /** Admin: accepted_schools by school_code + password */
  async adminLogin(school_code: string, password: string): Promise<SessionPayload | null> {
    const code = school_code.trim();
    const { data, error } = await supabase
      .from('accepted_schools')
      .select('id, school_code, school_name, password')
      .eq('school_code', code)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { id?: string; school_code?: string; school_name?: string; password?: string };
    if (row.password !== password) return null;
    return {
      session_token: makeToken('admin', row.id ?? row.school_code ?? code),
      role: 'admin',
      school_code: row.school_code ?? code,
      user_id: row.id,
      profile: row.school_name ? { name: row.school_name, school_code: row.school_code } : undefined,
    };
  },

  /** Staff: staff_login by school_code + staff_id + plain_password */
  async staffLogin(school_code: string, staff_id: string, password: string): Promise<SessionPayload | null> {
    const code = school_code.trim();
    const sid = staff_id.trim();
    const { data, error } = await supabase
      .from('staff_login')
      .select('id, school_code, staff_id, plain_password')
      .eq('school_code', code)
      .eq('staff_id', sid)
      .eq('is_active', true)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { id?: string; school_code?: string; staff_id?: string; plain_password?: string | null };
    const storedPassword = row.plain_password ?? '';
    if (storedPassword !== password) return null;
    return {
      session_token: makeToken('staff', row.id ?? sid),
      role: 'teacher',
      school_code: row.school_code ?? code,
      user_id: row.id,
      profile: { staff_id: row.staff_id, school_code: row.school_code } as Profile,
    };
  },

  /** Student: student_login by school_code + admission_no + plain_password */
  async studentLogin(school_code: string, admission_no: string, password: string): Promise<SessionPayload | null> {
    const code = school_code.trim();
    const adm = admission_no.trim();
    const { data, error } = await supabase
      .from('student_login')
      .select('id, school_code, admission_no, plain_password')
      .eq('school_code', code)
      .eq('admission_no', adm)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as { id?: string; school_code?: string; admission_no?: string; plain_password?: string | null };
    const storedPassword = row.plain_password ?? '';
    if (storedPassword !== password) return null;
    return {
      session_token: makeToken('student', row.id ?? adm),
      role: 'student',
      school_code: row.school_code ?? code,
      user_id: row.id,
      profile: { admission_no: row.admission_no, school_code: row.school_code } as Profile,
    };
  },
};
