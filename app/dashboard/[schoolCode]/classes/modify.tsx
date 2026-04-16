/**
 * Modify Classes — spec path /classes/modify.
 * Create, edit, delete classes; assign class teacher. Uses main classes list.
 */

import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function ModifyClassesScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('classes') as any} />;
}
