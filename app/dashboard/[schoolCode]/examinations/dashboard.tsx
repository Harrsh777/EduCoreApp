/** Spec path /examinations/dashboard — overview of exams. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function ExaminationsDashboardScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('examinations') as any} />;
}
