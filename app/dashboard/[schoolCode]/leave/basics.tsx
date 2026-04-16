/** Spec path /leave/basics. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function LeaveBasicsScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('leave') as any} />;
}
