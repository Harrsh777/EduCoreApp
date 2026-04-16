/**
 * Diary / Homework APIs. When USE_SUPABASE_DASHBOARD, data from diaries table.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getDiaryFromSupabase } from './diary.supabase';

/** GET /api/diary */
export function getDiary(school_code: string, params?: { class_id?: string; academic_year?: string; academic_year_id?: string; type?: string; page?: number; limit?: number }) {
  if (env.USE_SUPABASE_DASHBOARD) return getDiaryFromSupabase(school_code, params);
  return api.get('/api/diary', { params: { school_code, ...params } });
}

/** GET /api/diary/:id */
export function getDiaryById(school_code: string, id: string) {
  return api.get(`/api/diary/${id}`, { params: { school_code } });
}

/** POST /api/diary (upload homework). Tables: diaries, diary_targets, diary_attachments, diary_reads, accepted_schools. */
export function postDiary(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/diary', body, { params: { school_code } });
}

/** GET /api/diary/stats?school_code= */
export function getDiaryStats(school_code: string) {
  return api.get('/api/diary/stats', { params: { school_code } });
}

/** PUT /api/diary/:id */
export function putDiary(school_code: string, id: string, body: Record<string, unknown>) {
  return api.put(`/api/diary/${id}`, body, { params: { school_code } });
}

/** DELETE /api/diary/:id */
export function deleteDiary(school_code: string, id: string) {
  return api.delete(`/api/diary/${id}`, { params: { school_code } });
}

/** POST /api/diary/upload */
export function uploadDiaryAttachment(school_code: string, formData: FormData) {
  return api.post('/api/diary/upload', formData, {
    params: { school_code },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const diaryService = {
  getDiary,
  getDiaryById,
  postDiary,
  getDiaryStats,
  putDiary,
  deleteDiary,
  uploadDiaryAttachment,
};
