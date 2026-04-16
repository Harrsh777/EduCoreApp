/** Spec path /examinations/reports — exam reports (schedule, marks summary, pass/fail). */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function ExaminationReportsScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('reports') as any} />;
}
