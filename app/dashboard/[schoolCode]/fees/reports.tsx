/** Spec path /fees/reports — daily/monthly collection, pending, overdue. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function FeesReportsScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('reports') as any} />;
}
