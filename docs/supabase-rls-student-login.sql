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
