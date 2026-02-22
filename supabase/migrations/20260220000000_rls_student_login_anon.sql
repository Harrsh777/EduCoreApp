-- RLS for student_login: allow anon to SELECT for mobile app login.
-- The app uses: .from('student_login').select(...).eq('school_code',...).eq('admission_no',...).eq('is_active',true).maybeSingle()
-- Without this policy, anon gets "permission denied for table student_login".

-- Enable RLS on student_login (idempotent)
ALTER TABLE IF EXISTS student_login ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if you re-run (optional, for clean re-apply)
DROP POLICY IF EXISTS "anon_select_student_login" ON student_login;

-- Allow anon to SELECT rows (required for login lookup)
-- Restricts to reading only; INSERT/UPDATE/DELETE remain denied for anon
CREATE POLICY "anon_select_student_login"
  ON student_login
  FOR SELECT
  TO anon
  USING (true);

-- Optional: if you have a students table for profile data and need anon to read
-- only the current student after login, use a more restrictive policy or skip.
-- This file only touches student_login.
