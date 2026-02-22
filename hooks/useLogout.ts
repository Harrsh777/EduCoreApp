/**
 * Logout: call POST /api/auth/logout, clear SecureStore + Zustand, redirect to admin or public login.
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { authService } from '@/services/auth.service';

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.role);

  const performLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore API errors; clear local session anyway
    }
    const wasAdmin = role === 'admin';
    const wasTeacher = role === 'teacher';
    const wasStudent = role === 'student';
    await logout();
    if (wasAdmin) router.replace('/admin/login' as never);
    else if (wasTeacher) router.replace('/staff/login' as never);
    else if (wasStudent) router.replace('/student/login' as never);
    else router.replace('/login' as never);
  }, [logout, router, role]);

  return performLogout;
}
