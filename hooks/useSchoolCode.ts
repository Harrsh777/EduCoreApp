/**
 * useSchoolCode: current school code from teacher/session context.
 */

import { useTeacher } from './useTeacher';

export function useSchoolCode(): string {
  const { schoolCode } = useTeacher();
  return schoolCode ?? '';
}
