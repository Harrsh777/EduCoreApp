/** Spec path /fees/discounts-fines — configure or apply discounts/fines. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function FeesDiscountsFinesScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('fees') as any} />;
}
