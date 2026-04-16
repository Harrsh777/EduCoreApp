/** Spec path /library/basics — CRUD sections and material types. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function LibraryBasicsScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('library') as any} />;
}
