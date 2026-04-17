/**
 * /dashboard with no schoolCode: redirect admins to their dashboard,
 * otherwise route to the main public login hub.
 */

import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/auth-store';

export default function DashboardIndexScreen() {
  const school_code = useAuthStore((s) => s.school_code);
  const role = useAuthStore((s) => s.role);

  if (role === 'admin' && school_code) {
    return <Redirect href={`/dashboard/${encodeURIComponent(school_code)}`} />;
  }
  return <Redirect href="/login" />;
}
