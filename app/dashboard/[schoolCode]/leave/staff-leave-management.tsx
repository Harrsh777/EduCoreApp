/** Spec path /leave/staff-leave-management. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function StaffLeaveManagementScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('leave') as any} />;
}
