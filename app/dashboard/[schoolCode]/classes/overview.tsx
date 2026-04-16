/**
 * Classes Overview — spec path /classes/overview.
 * Shows summary of all classes with student count and class teacher; same as main list.
 */

import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function ClassesOverviewScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('classes') as any} />;
}
