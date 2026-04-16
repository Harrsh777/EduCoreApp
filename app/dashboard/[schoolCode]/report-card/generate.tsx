/** Spec path /report-card/generate — generate for exam/class/students using template. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function ReportCardGenerateScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('report-card') as any} />;
}
