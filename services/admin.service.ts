/**
 * Admin service: super-admin APIs.
 * All requests go through lib/api. Exact API paths; no mock data.
 */

import { api } from '@/lib/api';

// --- Types (match backend response shapes) ---

export type School = {
  id: string;
  school_code?: string;
  name?: string;
  status?: string;
  [key: string]: unknown;
};

export type DemoRequest = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  preferred_slot?: string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type OverviewStats = {
  schools?: number;
  students?: number;
  staff?: number;
  [key: string]: unknown;
};

export type AnalyticsData = {
  [key: string]: unknown;
};

export type AdminUser = {
  id: string;
  [key: string]: unknown;
};

// --- API functions ---

/** GET /api/schools */
export function getSchools(params?: { status?: string }) {
  return api.get<School[]>('/api/schools', { params });
}

/** PATCH /api/schools/[id]/status */
export function updateSchoolStatus(id: string, body: { status: string }) {
  return api.patch<School>(`/api/schools/${id}/status`, body);
}

/** GET /api/admin/overview */
export function getAdminOverview() {
  return api.get<OverviewStats>('/api/admin/overview');
}

/** GET /api/admin/analytics */
export function getAdminAnalytics() {
  return api.get<AnalyticsData>('/api/admin/analytics');
}

/** GET /api/admin/demo-requests */
export function getAdminDemoRequests() {
  return api.get<DemoRequest[]>('/api/admin/demo-requests');
}

/** GET /api/admin/users */
export function getAdminUsers() {
  return api.get<AdminUser[]>('/api/admin/users');
}

export const adminService = {
  getSchools,
  updateSchoolStatus,
  getAdminOverview,
  getAdminAnalytics,
  getAdminDemoRequests,
  getAdminUsers,
};
