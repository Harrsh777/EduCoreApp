/** Spec path /report-card/dashboard — list generated report cards. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function ReportCardDashboardScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('report-card') as any} />;
}
