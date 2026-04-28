import { api } from '@/lib/api';

const withSchool = (school_code: string, params?: Record<string, unknown>) => ({
  params: { school_code, ...(params ?? {}) },
});

export type AdminStaff = {
  id: string;
  staff_id?: string;
  name?: string;
  full_name?: string;
  designation?: string;
  department?: string;
  phone?: string;
  email?: string;
};

export type RoleOption = {
  id: string;
  name?: string;
  label?: string;
};

export type ClassItem = {
  id: string;
  class?: string;
  class_name?: string;
  section?: string;
  class_teacher_id?: string;
  class_teacher_staff_id?: string;
};

export const adminRoleAssignmentService = {
  getStaff(school_code: string, search?: string) {
    return api.get('/api/admin/staff', withSchool(school_code, search ? { search } : undefined));
  },
  getRoles(school_code: string) {
    return api.get('/api/roles', withSchool(school_code));
  },
  getStaffRoles(school_code: string, staffId: string) {
    return api.get(`/api/staff/${staffId}/roles`, withSchool(school_code));
  },
  saveStaffRoles(school_code: string, staffId: string, role_ids: string[]) {
    return api.post(`/api/staff/${staffId}/roles`, { role_ids }, withSchool(school_code));
  },
  getClasses(school_code: string) {
    return api.get('/api/classes', withSchool(school_code));
  },
  assignClassTeacher(school_code: string, classId: string, staffId: string) {
    return api.patch(
      `/api/classes/${classId}`,
      { class_teacher_id: staffId, class_teacher_staff_id: staffId },
      withSchool(school_code)
    );
  },
  getClassSubjects(school_code: string, classId: string) {
    return api.get(`/api/classes/${classId}/subjects`, withSchool(school_code));
  },
  assignSubjectTeacher(
    school_code: string,
    classId: string,
    body: {
      subject_id: string;
      teacher_id: string;
      period?: string | number;
      day?: string;
    }
  ) {
    return api.patch(`/api/classes/${classId}/subjects`, body, withSchool(school_code));
  },
};
