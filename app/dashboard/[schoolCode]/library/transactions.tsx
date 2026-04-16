/** Spec path /library/transactions — list issue/return; perform return. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function LibraryTransactionsScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('library') as any} />;
}
