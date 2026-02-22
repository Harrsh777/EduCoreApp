/**
 * Role hook: current role and role checks.
 */

import { useAuthStore, type Role } from '@/lib/auth-store';

export function useRole() {
  const role = useAuthStore((s) => s.role);
  return {
    role,
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher',
    isStudent: role === 'student',
    isAccountant: role === 'accountant',
    hasRole: (r: Role) => role === r,
    hasAnyRole: (roles: Role[]) => Boolean(role && roles.includes(role)),
  };
}
