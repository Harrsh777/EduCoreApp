/** Spec path /fees/v2/fee-heads — CRUD fee heads. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function FeesV2FeeHeadsScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('fees') as any} />;
}
