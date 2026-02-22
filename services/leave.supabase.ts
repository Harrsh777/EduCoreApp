/**
 * Leave from Supabase. Tables: leave_types, staff_leave_requests, student_leave_requests.
 */

import { supabase } from '@/lib/supabase';

export async function getLeaveDashboardSummaryFromSupabase(school_code: string) {
  const sc = school_code.trim();
  const [staffPending, studentPending, typesRes] = await Promise.all([
    supabase.from('staff_leave_requests').select('id', { count: 'exact', head: true }).eq('school_code', sc).eq('status', 'pending'),
    supabase.from('student_leave_requests').select('id', { count: 'exact', head: true }).eq('school_code', sc).eq('status', 'pending'),
    supabase.from('leave_types').select('*').eq('school_code', sc),
  ]);
  return {
    data: {
      pendingStaffCount: staffPending.count ?? 0,
      pendingStudentCount: studentPending.count ?? 0,
      leaveTypes: typesRes.data ?? [],
    },
  };
}

export async function getLeaveTypesFromSupabase(school_code: string) {
  const { data, error } = await supabase
    .from('leave_types')
    .select('*')
    .eq('school_code', school_code.trim())
    .order('name');
  if (error) return { data: [] };
  return { data: data ?? [] };
}
