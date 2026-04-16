/** Spec path /fees/v2/dashboard — summary: collected, this month, pending. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function FeesV2DashboardScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('fees') as any} />;
}
