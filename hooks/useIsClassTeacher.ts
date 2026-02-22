/**
 * useIsClassTeacher: derived from GET /api/classes/teacher (teacher context).
 */

import { useTeacher } from './useTeacher';

export function useIsClassTeacher(): boolean {
  const { isClassTeacher } = useTeacher();
  return isClassTeacher;
}
