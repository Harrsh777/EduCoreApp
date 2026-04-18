import { Redirect } from 'expo-router';

/** Legacy /student/dashboard/fees → v2 statement UI. */
export default function StudentFeesIndexRedirect() {
  return <Redirect href="./v2" />;
}
