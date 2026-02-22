-- Allow anon to SELECT from all app tables (for mobile/app using anon key).
-- Enable RLS on each table and create one policy: anon can SELECT with USING (true).
-- Tables that do not exist are skipped. To allow anon INSERT/UPDATE/DELETE, add
-- a separate migration (e.g. anon_insert_all_tables.sql) or per-table policies.

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'accepted_schools',
    'academic_calendar',
    'classes',
    'demo_requests',
    'diaries',
    'events',
    'examinations',
    'fee_heads',
    'gallery',
    'institute_houses',
    'institute_working_days',
    'library_books',
    'leave_types',
    'notices',
    'payments',
    'staff',
    'staff_attendance',
    'staff_leave_requests',
    'staff_login',
    'student_attendance',
    'student_leave_requests',
    'student_login',
    'students',
    'timetable_slots',
    'transport_routes'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Enable RLS (skip if table does not exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      -- Drop existing policy if present (idempotent)
      EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON %I', tbl, tbl);
      -- Allow anon to SELECT all rows
      EXECUTE format(
        'CREATE POLICY "anon_select_%s" ON %I FOR SELECT TO anon USING (true)',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;
