/**
 * RBAC / Staff access control. Tables: staff, permission_categories, staff_permissions, staff_roles, role_permissions, sub_modules.
 */

import { api } from '@/lib/api';

const p = (school_code: string) => ({ params: { school_code } });

/** GET /api/rbac/staff-permissions?school_code= */
export function getStaffPermissions(school_code: string) {
  return api.get('/api/rbac/staff-permissions', p(school_code));
}

/** GET /api/rbac/staff-permissions/[staffId]?school_code= */
export async function getStaffPermissionsByStaff(school_code: string, staffId: string) {
  try {
    // On current deployment, staff-specific route may not exist. Use list API first to avoid repeated 404s.
    return await api.get('/api/rbac/staff-permissions', { params: { school_code, staff_id: staffId } });
  } catch (error: unknown) {
    // Fallback for deployments where staff-scoped RBAC is unstable/unsupported.
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 400 || status === 404 || status === 500) {
      return api.get('/api/rbac/staff-permissions', p(school_code));
    }
    throw error;
  }
}

/** PATCH staff permissions (upsert staff_permissions) */
export function updateStaffPermissions(
  school_code: string,
  staffId: string,
  body: Record<string, unknown>
) {
  return api.patch(`/api/rbac/staff-permissions/${staffId}`, body, p(school_code));
}

/** GET /api/roles?school_code= */
export function getRoles(school_code: string) {
  return api.get('/api/roles', p(school_code));
}

/** GET /api/permissions?school_code= (if used) */
export function getPermissions(school_code: string) {
  return api.get('/api/permissions', p(school_code));
}

export const rbacService = {
  getStaffPermissions,
  getStaffPermissionsByStaff,
  updateStaffPermissions,
  getRoles,
  getPermissions,
};
