/**
 * Student dashboard API: home stats and module data.
 * Uses school_code + student_id. 401 handled by lib/api.
 * Dashboard home data cached for 60 seconds.
 */

import { rawRowBalance } from '@/lib/studentFeesV2';
import { studentService } from '@/services/student.service';

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

function feeRowBalanceDue(row: Record<string, unknown>): number {
  if (typeof row.balance_due === 'number' && !Number.isNaN(row.balance_due)) {
    return Math.max(0, row.balance_due);
  }
  return rawRowBalance(row);
}

function parseDueDate(d?: string): Date | null {
  if (!d || typeof d !== 'string') return null;
  const t = Date.parse(d);
  if (Number.isNaN(t)) return null;
  return new Date(t);
}

/** Sum balances for line items whose due_date falls in the calendar month / quarter of ref (local time). */
export function sumFeesDueInMonthAndQuarter(
  feeRows: unknown[],
  ref: Date = new Date()
): { monthTotal: number; quarterTotal: number } {
  let monthTotal = 0;
  let quarterTotal = 0;
  const quarterOf = (m: number) => Math.floor(m / 3);
  if (!Array.isArray(feeRows)) return { monthTotal: 0, quarterTotal: 0 };
  for (const raw of feeRows) {
    const row = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
    const due = parseDueDate(row.due_date as string | undefined);
    if (!due) continue;
    const bal = feeRowBalanceDue(row);
    if (bal <= 0) continue;
    if (due.getFullYear() === ref.getFullYear() && due.getMonth() === ref.getMonth()) {
      monthTotal += bal;
    }
    if (
      due.getFullYear() === ref.getFullYear() &&
      quarterOf(due.getMonth()) === quarterOf(ref.getMonth())
    ) {
      quarterTotal += bal;
    }
  }
  return { monthTotal, quarterTotal };
}

/** Receipt rows excluding cancelled / void. */
export function countActiveReceipts(receiptRows: unknown[]): number {
  if (!Array.isArray(receiptRows)) return 0;
  return receiptRows.filter((raw) => {
    const row = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
    const st = String(row.status ?? '').toLowerCase();
    if (st === 'cancelled' || st === 'canceled' || st === 'void') return false;
    return true;
  }).length;
}

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

  const statsRes = await studentService.getStats(params).then((r) => r.data).catch(() => ({}));

  // Doc: /api/student/stats returns { data: { attendance, attendance_change, gpa, ... } } or flat
  const rawStats = (statsRes as { data?: Record<string, unknown> } | Record<string, unknown>) ?? {};
  const stats = (typeof rawStats.data === 'object' && rawStats.data !== null ? rawStats.data : rawStats) as Record<string, unknown>;
  const weeklyRawUnknown = await studentService
    .getWeeklyCompletion(params)
    .then((r) => r.data as unknown)
    .catch(() => ({}) as unknown);
  const weeklyRaw = (typeof weeklyRawUnknown === 'object' && weeklyRawUnknown !== null
    ? weeklyRawUnknown
    : {}) as {
    data?: { weekly_completion?: number; completed?: number; total?: number };
    weekly_completion?: number;
    completed?: number;
    total?: number;
  };
  const weekly = (weeklyRaw.data ?? weeklyRaw) as {
    weekly_completion?: number;
    completed?: number;
    total?: number;
  };

  const weeklyPct =
    weekly?.weekly_completion != null
      ? Number(weekly.weekly_completion)
      : weekly?.total != null && weekly.total > 0 && weekly?.completed != null
        ? Math.round((weekly.completed / weekly.total) * 100)
        : undefined;

  const data: DashboardStats = {
    attendance_percent: (stats.attendance_percent ?? stats.attendance) as number | undefined,
    upcoming_exams_count: undefined,
    pending_fees_count: (stats.pending_fees_count ?? stats.pending_fees) as number | undefined,
    weekly_completion_percent: weeklyPct,
  };

  cachedHome = { key, data, at: Date.now() };
  return data;
}

/** Invalidate cache (e.g. after login or pull-to-refresh). */
export function invalidateDashboardCache(): void {
  cachedHome = null;
}
