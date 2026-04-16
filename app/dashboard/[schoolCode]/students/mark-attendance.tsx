/**
 * Mark Attendance — spec path /students/mark-attendance.
 * Mark daily student attendance by class/section.
 */

import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function MarkAttendanceScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('students/attendance') as any} />;
}
