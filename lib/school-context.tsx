/**
 * School dashboard context: schoolCode from route param so all screens can read it.
 * Use in dashboard layout; API calls send school_code={schoolCode}.
 */

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from './auth-store';

type SchoolContextValue = {
  schoolCode: string;
  schoolName?: string;
  /** Build path for this dashboard e.g. /dashboard/SCH001/institute-info */
  path: (suffix: string) => string;
};

const SchoolContext = createContext<SchoolContextValue | null>(null);

export function useSchoolCode(): SchoolContextValue {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchoolCode must be used inside SchoolProvider');
  return ctx;
}

export function useSchoolCodeOrNull(): SchoolContextValue | null {
  return useContext(SchoolContext);
}

type SchoolProviderProps = {
  children: ReactNode;
  schoolCode: string;
};

export function SchoolProvider({ children, schoolCode }: SchoolProviderProps) {
  const profile = useAuthStore((s) => s.profile);
  const schoolName = (profile?.name as string) ?? (profile?.school_name as string) ?? undefined;

  const path = useCallback(
    (suffix: string) => {
      const base = `/dashboard/${encodeURIComponent(schoolCode)}`;
      if (!suffix || suffix === 'index' || suffix === '') return base;
      return `${base}/${suffix.replace(/^\//, '')}`;
    },
    [schoolCode]
  );

  const value: SchoolContextValue = {
    schoolCode,
    schoolName,
    path,
  };

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

/**
 * Hook that provides schoolCode from route params when inside dashboard/[schoolCode].
 * Use in dashboard layout to get param and pass to SchoolProvider.
 */
export function useSchoolCodeFromParams(): string | null {
  const params = useLocalSearchParams<{ schoolCode?: string }>();
  return params.schoolCode ?? null;
}
