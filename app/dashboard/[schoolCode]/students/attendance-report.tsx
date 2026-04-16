/**
 * Student Attendance Report — spec path /students/attendance-report.
 * View attendance summary by student/class/date range.
 */

import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function AttendanceReportScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('students/attendance') as any} />;
}
