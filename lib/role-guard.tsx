/**
 * Role guard: restrict access to routes by role.
 * Blocks wrong-role routes; redirects to correct dashboard or to login.
 */

import { usePathname, useRouter } from 'expo-router';
import { type ReactNode, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore, type Role } from './auth-store';

export function getDashboardPath(role: Role, school_code?: string | null): string {
  if (!role) return '/login';
  if (role === 'admin' && school_code) return `/dashboard/${encodeURIComponent(school_code)}`;
  if (role === 'admin') return '/dashboard';
  if (role === 'teacher') return '/teacher/dashboard';
  if (role === 'student') return '/student/dashboard';
  if (role === 'accountant') return '/accountant';
  return '/login';
}

type RoleGuardProps = {
  children: ReactNode;
  /** Allowed roles for this segment (e.g. ['teacher']). Empty = any authenticated role. */
  allowedRoles?: Role[];
  /** Redirect when no session (e.g. /login or /admin/login) */
  redirectTo?: string;
};

/**
 * Wraps children and redirects if auth state doesn't match.
 * - Not hydrated: no redirect (wait for hydrate).
 * - No session: redirect to redirectTo.
 * - Session but wrong role: redirect to correct dashboard for that role.
 */
export function RoleGuard({ children, allowedRoles = [], redirectTo = '/login' }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const session_token = useAuthStore((s) => s.session_token);
  const role = useAuthStore((s) => s.role);
  const school_code = useAuthStore((s) => s.school_code);

  useEffect(() => {
    if (!hydrated) return;

    const hasSession = Boolean(session_token && role);
    const isAllowed = allowedRoles.length === 0 ? hasSession : hasSession && role && allowedRoles.includes(role);

    if (!hasSession) {
      // Avoid redirect loop: skip if we're already on the login/redirect page
      const normalizedPath = pathname.replace(/\/$/, '') || '/';
      const normalizedRedirect = redirectTo.replace(/\/$/, '') || '/';
      if (normalizedPath !== normalizedRedirect) {
        router.replace(redirectTo as never);
      }
      return;
    }
    if (!isAllowed && role) {
      const targetPath = getDashboardPath(role, school_code);
      const normalizedPath = pathname.replace(/\/$/, '') || '/';
      const normalizedTarget = targetPath.replace(/\/$/, '') || '/';
      if (normalizedPath !== normalizedTarget) {
        router.replace(targetPath as never);
      }
    }
  }, [hydrated, session_token, role, school_code, allowedRoles, redirectTo, pathname]);

  if (!hydrated) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={loadingStyles.text}>Loading…</Text>
      </View>
    );
  }
  return <>{children}</>;
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  text: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
});

/**
 * Returns whether current user has one of the given roles.
 */
export function useHasRole(roles: Role[]): boolean {
  const { role } = useAuthStore();
  return role !== null && roles.includes(role);
}
