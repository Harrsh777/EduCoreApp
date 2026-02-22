/**
 * Redirect /student to /student/dashboard.
 */

import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function StudentIndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/student/dashboard' as never);
  }, [router]);
  return null;
}
