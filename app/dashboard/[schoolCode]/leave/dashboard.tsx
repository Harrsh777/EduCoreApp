/** Spec path /leave/dashboard. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function LeaveDashboardScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('leave') as any} />;
}
