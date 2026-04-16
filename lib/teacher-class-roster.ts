/**
 * Shared helpers: merge GET /api/classes/teacher rows with GET /api/classes for labels
 * and roster filters (students.class is the grade label, not class UUID).
 */

export type TeacherClassRow = {
  id: string;
  name?: string;
  class_name?: string;
  class?: string;
  section?: string;
  academic_year?: string | number;
  [k: string]: unknown;
};

export function str(v: unknown): string {
  return v != null && String(v).trim() ? String(v).trim() : '';
}

/** GET /api/classes payload: array, { data }, or Supabase { data: { data, sections } }. */
export function unwrapSchoolClassesPayload(raw: unknown): TeacherClassRow[] {
  if (Array.isArray(raw)) return raw as TeacherClassRow[];
  if (!raw || typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data as TeacherClassRow[];
  const inner = o.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const d = (inner as { data?: unknown }).data;
    if (Array.isArray(d)) return d as TeacherClassRow[];
  }
  return [];
}

/** Fill class/section/year from school-wide class row when /api/classes/teacher only returns ids. */
export function enrichTeacherClassesFromSchool(
  teacherRows: TeacherClassRow[],
  schoolRows: TeacherClassRow[]
): TeacherClassRow[] {
  const byId = new Map<string, TeacherClassRow>();
  for (const r of schoolRows) {
    if (r.id == null) continue;
    byId.set(String(r.id), r);
  }
  return teacherRows.map((t) => {
    const sid = t.id != null ? String(t.id) : '';
    const full = sid ? byId.get(sid) : undefined;
    if (!full) return { ...t, id: sid || String(t.id) };
    const classLabel =
      str(t.class_name) ||
      str(t.class) ||
      str(t.name) ||
      str(full.class_name) ||
      str(full.class) ||
      str(full.name);
    const section = str(t.section) || str(full.section);
    const academic_year = t.academic_year ?? full.academic_year;
    return {
      ...full,
      ...t,
      id: sid || String(full.id),
      class: str(t.class) || str(full.class) || classLabel || undefined,
      class_name: str(t.class_name) || str(full.class_name) || str(full.class) || classLabel || undefined,
      name: str(t.name) || str(full.name) || classLabel || undefined,
      section: section || undefined,
      academic_year,
    };
  });
}

export function classPillLabel(c: TeacherClassRow): string {
  const label = str(c.class_name) || str(c.class) || str(c.name);
  const sec = str(c.section);
  if (label && sec) return `${label}-${sec}`;
  if (label) return label;
  return str(c.id) || 'Class';
}

/** Value for GET /api/students?class= — must match students.class, not the class row UUID. */
export function rosterClassQueryParam(c: TeacherClassRow | undefined): string {
  if (!c) return '';
  return str(c.class_name) || str(c.class) || str(c.name);
}

export function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

/** Unwrap GET /api/classes/teacher response and normalize id / class_id. */
export function normalizeTeacherClassesFromApi(classesData: unknown): TeacherClassRow[] {
  const raw = (
    Array.isArray(classesData)
      ? classesData
      : (classesData as { data?: TeacherClassRow[] })?.data ??
        (classesData as { classes?: TeacherClassRow[] })?.classes ??
        []
  ) as Record<string, unknown>[];
  return raw
    .map((r) => {
      const id = String(r.id ?? r.class_id ?? '').trim();
      if (!id) return null;
      return { ...r, id } as TeacherClassRow;
    })
    .filter((x): x is TeacherClassRow => x != null);
}
