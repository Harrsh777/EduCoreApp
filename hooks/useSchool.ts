/**
 * School context hook: school_code and school-scoped helpers.
 */

import { useAuthStore } from '@/lib/auth-store';

export function useSchool() {
  const school_code = useAuthStore((s) => s.school_code);
  const profile = useAuthStore((s) => s.profile);
  return {
    school_code: school_code ?? undefined,
    schoolCode: school_code ?? undefined,
    hasSchool: Boolean(school_code),
    /** From profile, e.g. school name */
    schoolName: (profile?.name as string) ?? undefined,
  };
}
