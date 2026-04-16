/**
 * Student Directory — spec path /students/directory.
 * Searchable, filterable list; same as students index.
 */

import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function StudentDirectoryScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('students') as any} />;
}
