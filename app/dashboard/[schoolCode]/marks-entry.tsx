/**
 * Mark Entry — spec path /marks-entry.
 * Enter marks per exam, class, subject for each student.
 */

import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function MarksEntryScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('marks') as any} />;
}
