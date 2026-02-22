/**
 * Timetable APIs. Same as web.
 */

import { api } from '@/lib/api';

const p = (school_code: string, extra?: Record<string, string>) => ({ params: { school_code, ...extra } });

/** GET /api/timetable/slots */
export function getTimetableSlots(school_code: string, params?: { class_id?: string; teacher_id?: string }) {
  return api.get('/api/timetable/slots', p(school_code, params as Record<string, string>));
}

/** GET /api/timetable/period-groups */
export function getTimetablePeriodGroups(school_code: string) {
  return api.get('/api/timetable/period-groups', p(school_code));
}

/** GET /api/timetable/list */
export function getTimetableList(school_code: string) {
  return api.get('/api/timetable/list', p(school_code));
}

/** POST /api/timetable/slots or PATCH (upsert) */
export function upsertTimetableSlots(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/timetable/slots', body, p(school_code));
}

export const timetableService = {
  getTimetableSlots,
  getTimetablePeriodGroups,
  getTimetableList,
  upsertTimetableSlots,
};
