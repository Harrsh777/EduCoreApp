/** Spec path /transport/stops — CRUD stops. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function TransportStopsScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('transport') as any} />;
}
