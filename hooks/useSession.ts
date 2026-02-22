/**
 * Session hook: auth state and session actions.
 */

import { useAuthStore } from '@/lib/auth-store';

export function useSession() {
  const store = useAuthStore.getState();
  return {
    session_token: useAuthStore((s) => s.session_token),
    role: useAuthStore((s) => s.role),
    school_code: useAuthStore((s) => s.school_code),
    user_id: useAuthStore((s) => s.user_id),
    profile: useAuthStore((s) => s.profile),
    hydrated: useAuthStore((s) => s.hydrated),
    isAuthenticated: Boolean(useAuthStore((s) => s.session_token) && useAuthStore((s) => s.role)),
    login: store.login,
    logout: store.logout,
    setSession: store.setSession,
    hydrate: store.hydrate,
    setProfile: store.setProfile,
  };
}
