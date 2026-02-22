/**
 * Student dashboard API: home stats and module data.
 * Uses school_code + student_id. 401 handled by lib/api.
 * Dashboard home data cached for 60 seconds.
 */

import { studentService } from '@/services/student.service';
import { examinationService } from '@/services/examination.service';

const DASHBOARD_CACHE_MS = 60 * 1000;

export type DashboardHomeParams = {
  school_code: string;
  student_id: string;
};

export type DashboardStats = {
  attendance_percent?: number;
  upcoming_exams_count?: number;
  pending_fees_count?: number;
  weekly_completion_percent?: number;
};

let cachedHome: { key: string; data: DashboardStats; at: number } | null = null;

function cacheKey(params: DashboardHomeParams): string {
  return `${params.school_code}:${params.student_id}`;
}

/** Fetch dashboard home stats; cache for 60s. */
export async function getDashboardHomeStats(
  params: DashboardHomeParams
): Promise<DashboardStats> {
  const key = cacheKey(params);
  if (cachedHome?.key === key && Date.now() - cachedHome.at < DASHBOARD_CACHE_MS) {
    return cachedHome.data;
  }

  const [statsRes, examsRes] = await Promise.all([
    studentService.getStats(params).then((r) => r.data).catch(() => ({})),
    examinationService
      .getExaminations(params.school_code, { status: 'upcoming' })
      .then((r) => r.data)
      .catch(() => []),
  ]);

  // Doc: /api/student/stats returns { data: { attendance, attendance_change, gpa, ... } } or flat
  const rawStats = (statsRes as { data?: Record<string, unknown> } | Record<string, unknown>) ?? {};
  const stats = (typeof rawStats.data === 'object' && rawStats.data !== null ? rawStats.data : rawStats) as Record<string, unknown>;
  const examsList = Array.isArray(examsRes) ? examsRes : (examsRes as { data?: unknown[] })?.data ?? [];
  const weeklyRaw = await studentService
    .getWeeklyCompletion(params)
    .then((r) => r.data as { data?: { weekly_completion?: number; assignments_to_complete?: number }; weekly_completion?: number; completed?: number; total?: number })
    .catch(() => ({}));
  const weekly = (weeklyRaw?.data ?? weeklyRaw) as { weekly_completion?: number; completed?: number; total?: number };

  const weeklyPct =
    weekly?.weekly_completion != null
      ? Number(weekly.weekly_completion)
      : weekly?.total != null && weekly.total > 0 && weekly?.completed != null
        ? Math.round((weekly.completed / weekly.total) * 100)
        : undefined;

  const data: DashboardStats = {
    attendance_percent: (stats.attendance_percent ?? stats.attendance) as number | undefined,
    upcoming_exams_count: examsList.length,
    pending_fees_count: undefined,
    weekly_completion_percent: weeklyPct,
  };

  cachedHome = { key, data, at: Date.now() };
  return data;
}

/** Invalidate cache (e.g. after login or pull-to-refresh). */
export function invalidateDashboardCache(): void {
  cachedHome = null;
}
