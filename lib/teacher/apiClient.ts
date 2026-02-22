/**
 * Teacher API client: base axios instance. All teacher API calls use this.
 * Re-exports the central api from lib/api (same base URL, interceptors, auth).
 */

export { api as apiClient } from '@/lib/api';
export { default as api } from '@/lib/api';
