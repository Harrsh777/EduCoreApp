/** Spec path /transport/vehicles — CRUD vehicles. */
import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function TransportVehiclesScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('transport') as any} />;
}
