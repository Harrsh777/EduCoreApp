/** Spec path /certificates/dashboard. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function CertificatesDashboardScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('certificates') as any} />;
}
