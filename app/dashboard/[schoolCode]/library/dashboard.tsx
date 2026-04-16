/** Spec path /library/dashboard — summary: books, issued, overdue. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function LibraryDashboardScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('library') as any} />;
}
