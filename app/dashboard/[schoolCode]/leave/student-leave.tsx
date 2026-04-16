/** Spec path /leave/student-leave. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function StudentLeaveScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('leave') as any} />;
}
