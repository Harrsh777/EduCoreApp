/**
 * Student fee rows from GET /api/student/fees — supports `student_fees` and legacy array shapes.
 */

export function extractStudentFeesRows(body: unknown): Record<string, unknown>[] {
  const raw = extractStudentFeesRowsInner(body);
  return raw.map((r) =>
    typeof r === 'object' && r !== null ? (r as Record<string, unknown>) : {},
  );
}

function extractStudentFeesRowsInner(body: unknown): unknown[] {
  if (body == null) return [];
  if (Array.isArray(body)) return body;
  const o = body as Record<string, unknown>;
  if (Array.isArray(o.student_fees)) return o.student_fees;
  if (Array.isArray(o.fees)) return o.fees;
  const data = o.data;
  if (Array.isArray(data)) return data;
  if (data != null && typeof data === 'object') {
    const inner = data as Record<string, unknown>;
    if (Array.isArray(inner.student_fees)) return inner.student_fees;
    if (Array.isArray(inner.fees)) return inner.fees;
  }
  return [];
}

export function numField(v: unknown, defaultVal = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return defaultVal;
}

/** balance = base - paid - adjustment (or non-negative API balance when present). */
export function rawRowBalance(row: Record<string, unknown>): number {
  const base = numField(row.base_amount ?? row.amount);
  const paid = numField(row.paid_amount);
  const adj = numField(row.adjustment ?? row.discount);
  if (typeof row.balance === 'number' && !Number.isNaN(row.balance)) {
    return Math.max(0, row.balance);
  }
  return Math.max(0, base - paid - adj);
}

export type StudentFeeLineStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export type StudentFeeLine = {
  id: string;
  student_id: string | null;
  fee_source: string;
  title: string;
  subtitle?: string;
  due_date: string | null;
  base_amount: number;
  paid_amount: number;
  adjustment: number;
  balance: number;
  status: StudentFeeLineStatus;
};

function transportSubtitle(snap: unknown): string | undefined {
  if (snap == null || typeof snap !== 'object') return undefined;
  const s = snap as Record<string, unknown>;
  for (const k of ['label', 'period', 'month', 'route_name', 'description']) {
    const v = s[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

export function normalizeStudentFeeRow(
  row: Record<string, unknown>,
  studentId: string,
): StudentFeeLine | null {
  if (studentId && row.student_id != null && String(row.student_id) !== String(studentId)) {
    return null;
  }
  const id = row.id != null ? String(row.id) : `row-${Math.random().toString(36).slice(2)}`;
  const base = numField(row.base_amount ?? row.amount);
  const paid = numField(row.paid_amount);
  const adj = numField(row.adjustment ?? row.discount);
  const balance = rawRowBalance(row);
  const due = (row.due_date as string) ?? null;
  const feeSource =
    String(row.fee_source ?? 'structure')
      .toLowerCase()
      .trim() || 'structure';

  let title: string;
  let subtitle: string | undefined;
  if (feeSource === 'transport') {
    title = 'Transport (system)';
    subtitle = transportSubtitle(row.transport_snapshot);
  } else {
    const fs = row.fee_structure;
    let structName: string | undefined;
    if (fs != null && typeof fs === 'object') {
      const nm = (fs as Record<string, unknown>).name;
      if (typeof nm === 'string' && nm.trim()) structName = nm.trim();
    }
    const name = (row.fee_structure_name ??
      row.structure_name ??
      structName ??
      row.component_name ??
      row.name ??
      row.title) as string | undefined;
    title = name?.trim() ? String(name).trim() : 'Fee';
  }

  let status: StudentFeeLineStatus;
  if (base > 0 && paid >= base) status = 'paid';
  else if (base <= 0) status = 'paid';
  else if (paid <= 0) status = 'pending';
  else status = 'partial';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due && status !== 'paid') {
    const d = new Date(due);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      if (d < today) status = 'overdue';
    }
  }

  return {
    id,
    student_id: row.student_id != null ? String(row.student_id) : null,
    fee_source: feeSource,
    title,
    subtitle,
    due_date: due,
    base_amount: base,
    paid_amount: paid,
    adjustment: adj,
    balance,
    status,
  };
}

export function normalizeStudentFees(
  rows: Record<string, unknown>[],
  studentId: string,
): StudentFeeLine[] {
  const out: StudentFeeLine[] = [];
  for (const r of rows) {
    const n = normalizeStudentFeeRow(r, studentId);
    if (n) out.push(n);
  }
  return out;
}

const quarterOf = (m: number) => Math.floor(m / 3);

function dueInCalendarMonth(due: string, ref: Date): boolean {
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function dueInCalendarQuarter(due: string, ref: Date): boolean {
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === ref.getFullYear() && quarterOf(d.getMonth()) === quarterOf(ref.getMonth())
  );
}

/** Sum of balance per fee_source for lines with due_date in the current calendar month (local). */
export function sumBalancesByFeeSourceThisMonth(
  lines: StudentFeeLine[],
  ref: Date = new Date(),
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const line of lines) {
    if (!line.due_date || !dueInCalendarMonth(line.due_date, ref)) continue;
    const b = line.balance;
    if (b <= 0) continue;
    acc[line.fee_source] = (acc[line.fee_source] ?? 0) + b;
  }
  return acc;
}

/** Sum of balance per fee_source for lines with due_date in the current calendar quarter (local). */
export function sumBalancesByFeeSourceThisQuarter(
  lines: StudentFeeLine[],
  ref: Date = new Date(),
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const line of lines) {
    if (!line.due_date || !dueInCalendarQuarter(line.due_date, ref)) continue;
    const b = line.balance;
    if (b <= 0) continue;
    acc[line.fee_source] = (acc[line.fee_source] ?? 0) + b;
  }
  return acc;
}

export function sortFeeLinesByDueDateAsc(lines: StudentFeeLine[]): StudentFeeLine[] {
  return [...lines].sort((a, b) => {
    const ta = a.due_date ? Date.parse(a.due_date) : NaN;
    const tb = b.due_date ? Date.parse(b.due_date) : NaN;
    const na = Number.isNaN(ta);
    const nb = Number.isNaN(tb);
    if (na && nb) return 0;
    if (na) return 1;
    if (nb) return -1;
    return ta - tb;
  });
}

export function feeSourceDisplayName(source: string): string {
  const s = source.trim() || 'structure';
  if (s === 'structure') return 'Structure';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Count rows that are fully paid (paid_amount >= base_amount, base > 0). */
export function countPaidFeeEntries(lines: StudentFeeLine[]): number {
  return lines.filter((l) => l.base_amount > 0 && l.paid_amount >= l.base_amount).length;
}
