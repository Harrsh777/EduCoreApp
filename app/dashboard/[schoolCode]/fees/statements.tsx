/** Spec path /fees/statements — per-student dues and payment history. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function FeesStatementsScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('fees') as any} />;
}
