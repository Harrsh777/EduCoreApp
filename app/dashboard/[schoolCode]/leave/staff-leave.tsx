/** Spec path /leave/staff-leave. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function StaffLeaveScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('leave') as any} />;
}
