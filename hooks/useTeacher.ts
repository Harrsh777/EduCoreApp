/**
 * useTeacher: read teacher from session/context (id, staff_id, school_code, path, permissions, isClassTeacher).
 */

import { useTeacher as useTeacherContext } from '@/lib/teacher-context';

export function useTeacher() {
  return useTeacherContext();
}
