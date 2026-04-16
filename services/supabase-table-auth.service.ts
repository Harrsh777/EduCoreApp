/**
 * Supabase table-based auth: accepted_schools, staff_login, student_login.
 * - Admin: accepted_schools (school_code + password column)
 * - Staff / student: plain_password when set, otherwise password_hash (bcrypt, same as typical Node bcrypt)
 */

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/auth-store';
import bcrypt from 'bcryptjs';

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

/** Match plain_password if present; otherwise verify bcrypt password_hash */
function passwordMatches(plain: string, row: { plain_password?: string | null; password_hash?: string | null }): boolean {
  const storedPlain = row.plain_password;
  if (storedPlain != null && storedPlain !== '' && storedPlain === plain) return true;
  const hash = row.password_hash;
  if (hash == null || hash === '') return false;
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

type StaffRow = {
  id?: string;
  school_code?: string;
  staff_id?: string;
  plain_password?: string | null;
  password_hash?: string | null;
};

type StudentRow = {
  id?: string;
  school_code?: string;
  admission_no?: string;
  plain_password?: string | null;
  password_hash?: string | null;
};

const STAFF_FIELDS = 'id, school_code, staff_id, plain_password, password_hash';
const STUDENT_FIELDS = 'id, school_code, admission_no, plain_password, password_hash';

/** Prefer exact school_code match; fall back to ILIKE for case-only differences (avoids ILIKE when eq already works). */
async function fetchStaffLoginRow(code: string, staffId: string): Promise<StaffRow | null> {
  const base = () =>
    supabase.from('staff_login').select(STAFF_FIELDS).eq('staff_id', staffId).eq('is_active', true);

  const first = await base().eq('school_code', code).maybeSingle();
  if (first.error) throw first.error;
  if (first.data) return first.data as StaffRow;

  const second = await base().ilike('school_code', code).maybeSingle();
  if (second.error) throw second.error;
  return (second.data as StaffRow) ?? null;
}

async function fetchStudentLoginRow(code: string, admissionNo: string): Promise<StudentRow | null> {
  const base = () =>
    supabase.from('student_login').select(STUDENT_FIELDS).eq('admission_no', admissionNo).eq('is_active', true);

  const first = await base().eq('school_code', code).maybeSingle();
  if (first.error) throw first.error;
  if (first.data) return first.data as StudentRow;

  const second = await base().ilike('school_code', code).maybeSingle();
  if (second.error) throw second.error;
  return (second.data as StudentRow) ?? null;
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
    if (error) throw error;
    if (!data) return null;
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

  /** Staff: staff_login — school_code (case-insensitive), staff_id, plain_password or password_hash */
  async staffLogin(school_code: string, staff_id: string, password: string): Promise<SessionPayload | null> {
    const code = school_code.trim();
    const sid = staff_id.trim();
    const data = await fetchStaffLoginRow(code, sid);
    if (!data) return null;
    const row = data;
    if (!passwordMatches(password, row)) return null;
    return {
      session_token: makeToken('staff', row.id ?? sid),
      role: 'teacher',
      school_code: row.school_code ?? code,
      user_id: row.id,
      profile: { staff_id: row.staff_id, school_code: row.school_code } as Profile,
    };
  },

  /** Student: student_login — school_code (case-insensitive), admission_no, plain_password or password_hash */
  async studentLogin(school_code: string, admission_no: string, password: string): Promise<SessionPayload | null> {
    const code = school_code.trim();
    const adm = admission_no.trim();
    const data = await fetchStudentLoginRow(code, adm);
    if (!data) return null;
    const row = data;
    if (!passwordMatches(password, row)) return null;
    return {
      session_token: makeToken('student', row.id ?? adm),
      role: 'student',
      school_code: row.school_code ?? code,
      user_id: row.id,
      profile: { admission_no: row.admission_no, school_code: row.school_code } as Profile,
    };
  },
};
