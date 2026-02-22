/**
 * Student dashboard context: student object, schoolCode, path helper.
 * No RBAC for students; all see same menu.
 */

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useAuthStore } from './auth-store';

export type Student = {
  id: string;
  school_code: string;
  admission_no?: string;
  class?: string;
  section?: string;
  full_name?: string;
  academic_year?: string;
  [k: string]: unknown;
};

type StudentContextValue = {
  student: Student | null;
  schoolCode: string;
  /** Build path e.g. /student/dashboard/class */
  path: (suffix: string) => string;
};

const StudentContext = createContext<StudentContextValue | null>(null);

export function useStudent(): StudentContextValue {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used inside StudentProvider');
  return ctx;
}

export function useStudentOrNull(): StudentContextValue | null {
  return useContext(StudentContext);
}

type StudentProviderProps = {
  children: ReactNode;
};

export function StudentProvider({ children }: StudentProviderProps) {
  const profile = useAuthStore((s) => s.profile);
  const user_id = useAuthStore((s) => s.user_id);
  const school_code = useAuthStore((s) => s.school_code);
  const role = useAuthStore((s) => s.role);

  const student: Student | null =
    role === 'student' && school_code
      ? {
          id: user_id ?? (profile?.id as string) ?? '',
          school_code: school_code,
          admission_no: profile?.admission_no as string | undefined,
          class: profile?.class as string | undefined,
          section: profile?.section as string | undefined,
          full_name: (profile?.name as string) ?? (profile?.full_name as string),
          academic_year: profile?.academic_year as string | undefined,
          ...profile,
        }
      : null;

  const path = useCallback((suffix: string) => {
    const base = '/student/dashboard';
    if (!suffix || suffix === 'index' || suffix === '') return base;
    return `${base}/${suffix.replace(/^\//, '')}`;
  }, []);

  const value: StudentContextValue = {
    student,
    schoolCode: school_code ?? '',
    path,
  };

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}
