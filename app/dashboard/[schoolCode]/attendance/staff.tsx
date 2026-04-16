/** Spec path /attendance/staff — mark daily staff attendance. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function AttendanceStaffScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('staff-management/attendance') as any} />;
}
