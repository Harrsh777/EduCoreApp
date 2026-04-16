/**
 * Events — spec path /calendar/events.
 * List and create events (holidays, school events).
 */

import { Redirect } from 'expo-router';
import { useSchoolCode } from '@/lib/school-context';

export default function CalendarEventsScreen() {
  const { path } = useSchoolCode();
  return <Redirect href={path('calendar') as any} />;
}
