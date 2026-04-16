/** Spec path /fees/v2/collection — record payment: student, amount, mode, date → receipt. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function FeesV2CollectionScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('fees') as any} />;
}
