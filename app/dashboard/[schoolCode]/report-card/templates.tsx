/** Spec path /report-card/templates — CRUD report card templates. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function ReportCardTemplatesScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('report-card') as any} />;
}
