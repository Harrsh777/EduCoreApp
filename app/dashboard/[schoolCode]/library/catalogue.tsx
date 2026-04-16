/** Spec path /library/catalogue — list/search books; add book and copies; issue. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function LibraryCatalogueScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('library') as any} />;
}
