/** Spec path /certificates/new — issue certificate. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function CertificateNewScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('certificates') as any} />;
}
