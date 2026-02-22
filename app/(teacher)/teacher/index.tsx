/**
 * Redirect /teacher to /teacher/dashboard.
 */

import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function TeacherIndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/teacher/dashboard' as never);
  }, [router]);
  return null;
}
