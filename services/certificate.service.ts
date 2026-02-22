/**
 * Certificate APIs. Same as web. GET /api/certificates?school_code=&student_id=
 */

import { api } from '@/lib/api';

/** GET /api/certificates?school_code=&student_id= */
export function getCertificates(school_code: string, student_id: string) {
  return api.get('/api/certificates', { params: { school_code, student_id } });
}

/** GET /api/certificates/[id]/download or view URL if supported */
export function getCertificateDownloadUrl(school_code: string, certificateId: string) {
  return api.get<{ url?: string }>(`/api/certificates/${certificateId}/download`, { params: { school_code } });
}

/** GET /api/certificates/simple — types / list for teacher */
export function getCertificatesSimple(school_code: string, params?: { class_id?: string; student_id?: string }) {
  return api.get('/api/certificates/simple', { params: { school_code, ...params } });
}

/** POST /api/certificates/simple/upload */
export function uploadCertificateSimple(school_code: string, body: FormData | Record<string, unknown>) {
  const isForm = body instanceof FormData;
  return api.post('/api/certificates/simple/upload', body, {
    params: { school_code },
    headers: isForm ? undefined : { 'Content-Type': 'application/json' },
  });
}

export const certificateService = {
  getCertificates,
  getCertificateDownloadUrl,
  getCertificatesSimple,
  uploadCertificateSimple,
};
