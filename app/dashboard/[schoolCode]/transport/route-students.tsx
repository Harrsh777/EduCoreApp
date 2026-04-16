/** Spec path /transport/route-students — assign students to route and stop. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function TransportRouteStudentsScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('transport') as any} />;
}
