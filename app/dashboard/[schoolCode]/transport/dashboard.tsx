/** Spec path /transport/dashboard — overview: routes, vehicles, students mapped. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function TransportDashboardScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('transport') as any} />;
}
