/**
 * Calendar / Events APIs. When USE_SUPABASE_DASHBOARD, data from academic_calendar and events.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getCalendarAcademicFromSupabase, getCalendarEventsFromSupabase } from './calendar.supabase';

const p = (school_code: string, extra?: Record<string, unknown>) => ({ params: { school_code, ...extra } });

/** GET /api/calendar/academic — doc: school_code, academic_year, include_events (true|false) */
export function getCalendarAcademic(
  school_code: string,
  params?: { academic_year?: string; include_events?: boolean }
) {
  if (env.USE_SUPABASE_DASHBOARD) {
    return getCalendarAcademicFromSupabase(school_code, {
      academic_year: params?.academic_year,
      include_events: params?.include_events,
    });
  }
  return api.get('/api/calendar/academic', p(school_code, params as Record<string, unknown>));
}

/** GET /api/calendar/events */
export function getCalendarEvents(school_code: string, params?: { start?: string; end?: string }) {
  if (env.USE_SUPABASE_DASHBOARD) return getCalendarEventsFromSupabase(school_code, params);
  return api.get('/api/calendar/events', p(school_code, params as Record<string, string>));
}

/** POST /api/calendar/events (if supported) */
export function createCalendarEvent(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/calendar/events', body, p(school_code));
}

/** GET /api/calendar/notifications?school_code=&user_type=&user_id=&unread_only= */
export function getCalendarNotifications(
  school_code: string,
  params: { user_type: string; user_id: string; unread_only?: boolean }
) {
  return api.get('/api/calendar/notifications', p(school_code, params as Record<string, string>));
}

export const calendarService = {
  getCalendarAcademic,
  getCalendarEvents,
  createCalendarEvent,
  getCalendarNotifications,
};
