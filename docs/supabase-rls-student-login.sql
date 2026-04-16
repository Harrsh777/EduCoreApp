-- Run this in Supabase Dashboard → SQL Editor to fix "permission denied" on student_login.
-- This allows the mobile app (anon key) to read from student_login for login.

-- 1. Enable RLS on student_login
ALTER TABLE student_login ENABLE ROW LEVEL SECURITY;

-- 2. Allow anon to SELECT (so login query can run)
DROP POLICY IF EXISTS "anon_select_student_login" ON student_login;
CREATE POLICY "anon_select_student_login"
  ON student_login
  FOR SELECT
  TO anon
  USING (true);

-- staff_login (same pattern as student_login for table-based auth from the app)
ALTER TABLE staff_login ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_staff_login" ON staff_login;
CREATE POLICY "anon_select_staff_login"
  ON staff_login
  FOR SELECT
  TO anon
  USING (true);
