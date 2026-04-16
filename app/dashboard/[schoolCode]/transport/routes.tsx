/** Spec path /transport/routes — create/edit routes. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function TransportRoutesScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('transport') as any} />;
}
