/**
 * Copy Checking APIs. Same as web/admin/teacher.
 * GET /api/copy-checking?school_code= — class → subjects → staff assignment.
 */

import { api } from '@/lib/api';

/** GET /api/copy-checking?school_code= */
export function getCopyChecking(school_code: string) {
  return api.get('/api/copy-checking', { params: { school_code } });
}

export const copyCheckingService = {
  getCopyChecking,
};
