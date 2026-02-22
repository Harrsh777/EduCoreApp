/**
 * Gallery APIs. When USE_SUPABASE_DASHBOARD, data from Supabase gallery table.
 */

import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { getGalleryFromSupabase } from './gallery.supabase';

const p = (school_code: string) => ({ params: { school_code } });

/** GET /api/gallery */
export function getGallery(school_code: string, category?: string) {
  if (env.USE_SUPABASE_DASHBOARD) return getGalleryFromSupabase(school_code, category);
  return api.get('/api/gallery', p(school_code));
}

/** GET /api/gallery/[id] */
export function getGalleryItem(school_code: string, id: string) {
  return api.get(`/api/gallery/${id}`, p(school_code));
}

/** POST /api/gallery (upload if supported) */
export function createGalleryItem(school_code: string, body: FormData | Record<string, unknown>) {
  return api.post('/api/gallery', body, p(school_code));
}

export const galleryService = {
  getGallery,
  getGalleryItem,
  createGalleryItem,
};
