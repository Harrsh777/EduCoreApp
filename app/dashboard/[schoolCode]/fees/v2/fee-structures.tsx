/** Spec path /fees/v2/fee-structures — attach heads to class/academic_year. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function FeesV2FeeStructuresScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('fees') as any} />;
}
