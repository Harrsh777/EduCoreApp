/**
 * Auth service: login, logout, session check.
 * When Supabase URL + anon key are set, auth uses Supabase (no custom backend; avoids ERR_CERT_AUTHORITY_INVALID).
 * Otherwise uses custom backend via lib/api.
 */

import { api } from '@/lib/api';
import type { Profile } from '@/lib/auth-store';
import { env } from '@/lib/env';
import { supabase, useSupabaseAuth } from '@/lib/supabase';

// --- Request bodies (exact API contract) ---

export type AdminLoginBody = {
  school_code: string;
  password: string;
};

export type TeacherLoginBody = {
  school_code: string;
  staff_id: string;
  password: string;
};

export type StudentLoginBody = {
  school_code: string;
  admission_no: string;
  password: string;
};

export type AccountantLoginBody = {
  school_code: string;
  staff_id: string;
  password: string;
};

// --- Response types ---

export type SessionResponse = {
  session_token?: string;
  role: string;
  school_code?: string;
  user_id?: string;
  school?: Record<string, unknown>;
  teacher?: Profile;
  student?: Profile;
  accountant?: Record<string, unknown>;
};

export type AdminLoginResponse = SessionResponse & {
  school?: Record<string, unknown>;
};

export type TeacherLoginResponse = SessionResponse & {
  teacher?: Profile;
};

export type StudentLoginResponse = SessionResponse & {
  student?: Profile;
};

export type AccountantLoginResponse = SessionResponse & {
  accountant?: Record<string, unknown>;
};

// --- Supabase auth (no custom backend; uses Supabase's HTTPS) ---

export type SupabaseSessionResponse = SessionResponse;

function profileFromMetadata(m: Record<string, unknown> | undefined): Profile | undefined {
  if (!m) return undefined;
  return {
    name: m.name as string | undefined,
    school_code: m.school_code as string | undefined,
    staff_id: m.staff_id as string | undefined,
    admission_no: m.admission_no as string | undefined,
    class: m.class as string | undefined,
    section: m.section as string | undefined,
    ...m,
  };
}

export const authService = {
  /** Sign in with Supabase (email + password). Role/school come from user_metadata. */
  async supabaseSignIn(email: string, password: string): Promise<SupabaseSessionResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    const session = data.session;
    const user = data.user;
    if (!session || !user) throw new Error('No session');
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const role = (meta.role as string) || 'admin';
    return {
      session_token: session.access_token,
      role,
      school_code: meta.school_code as string | undefined,
      user_id: user.id,
      profile: profileFromMetadata(meta),
    };
  },

  /** Get current session from Supabase. */
  async supabaseGetSession(): Promise<SupabaseSessionResponse | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
    return {
      session_token: session.access_token,
      role: (meta.role as string) || 'admin',
      school_code: meta.school_code as string | undefined,
      user_id: session.user.id,
      profile: profileFromMetadata(meta),
    };
  },

  /** Sign out from Supabase. */
  async supabaseSignOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  useSupabaseAuth,
  /** When true, login uses Supabase tables (accepted_schools, staff, students); session is stored in SecureStore only */
  useSupabaseTableAuth: env.USE_SUPABASE_TABLE_AUTH && useSupabaseAuth,

  // --- Custom backend API (used when Supabase auth is not configured) ---

  /** POST /api/auth/login */
  async adminLogin(body: AdminLoginBody): Promise<AdminLoginResponse> {
    const { data } = await api.post<AdminLoginResponse>('/api/auth/login', body);
    return data;
  },

  /** POST /api/auth/teacher/login */
  async teacherLogin(body: TeacherLoginBody): Promise<TeacherLoginResponse> {
    const { data } = await api.post<TeacherLoginResponse>('/api/auth/teacher/login', body);
    return data;
  },

  /** POST /api/auth/student/login */
  async studentLogin(body: StudentLoginBody): Promise<StudentLoginResponse> {
    const { data } = await api.post<StudentLoginResponse>('/api/auth/student/login', body);
    return data;
  },

  /** POST /api/auth/accountant/login */
  async accountantLogin(body: AccountantLoginBody): Promise<AccountantLoginResponse> {
    const { data } = await api.post<AccountantLoginResponse>('/api/auth/accountant/login', body);
    return data;
  },

  /** GET /api/auth/session (custom backend) or Supabase session when useSupabaseAuth. */
  async getSession(): Promise<SessionResponse | null> {
    if (useSupabaseAuth) return authService.supabaseGetSession();
    const { data } = await api.get<SessionResponse>('/api/auth/session');
    return data;
  },

  /** POST /api/auth/logout (custom backend) or Supabase signOut when useSupabaseAuth. */
  async logout(): Promise<void> {
    if (useSupabaseAuth) {
      await authService.supabaseSignOut();
      return;
    }
    await api.post('/api/auth/logout');
  },
};
