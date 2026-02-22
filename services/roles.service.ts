/**
 * Roles and permissions APIs. Same as web.
 */

import { api } from '@/lib/api';

const p = (school_code: string) => ({ params: { school_code } });

/** GET /api/roles */
export function getRoles(school_code: string) {
  return api.get('/api/roles', p(school_code));
}

/** POST /api/roles */
export function createRole(school_code: string, body: Record<string, unknown>) {
  return api.post('/api/roles', body, p(school_code));
}

/** PATCH /api/roles/[id] */
export function updateRole(school_code: string, id: string, body: Record<string, unknown>) {
  return api.patch(`/api/roles/${id}`, body, p(school_code));
}

/** DELETE /api/roles/[id] */
export function deleteRole(school_code: string, id: string) {
  return api.delete(`/api/roles/${id}`, p(school_code));
}

/** GET /api/roles/[id]/permissions */
export function getRolePermissions(school_code: string, roleId: string) {
  return api.get(`/api/roles/${roleId}/permissions`, p(school_code));
}

/** PATCH /api/roles/[id]/permissions */
export function updateRolePermissions(
  school_code: string,
  roleId: string,
  body: Record<string, unknown>
) {
  return api.patch(`/api/roles/${roleId}/permissions`, body, p(school_code));
}

export const rolesService = {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
};
