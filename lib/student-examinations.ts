/**
 * Student examinations: GET /api/examinations/v2/student shape → view model.
 * Legacy: top-level array = examinations only (class / structures empty).
 */

export type ExamScheduleRow = {
  subject: string;
  subject_name?: string;
  subject_id?: string;
  date?: string;
  exam_date?: string;
  time?: string;
  start_time?: string;
  end_time?: string;
  teacher_name?: string;
  room?: string;
};

export type SubjectTableRow = {
  subject_name: string;
  teacher_name?: string;
  max_marks?: string;
  pass_marks?: string;
  dateTimeLine: string;
};

export type NormalizedExam = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  examDate?: string;
  academicYear?: string;
  description?: string;
  termName?: string;
  structureName?: string;
  status?: string;
  schedules: ExamScheduleRow[];
  subjectRows: SubjectTableRow[];
  totalMaxMarks?: number;
  totalPassMarks?: number;
  dateSheetUrl?: string;
};

export type StructureTermVM = {
  id: string;
  serial: string;
  name: string;
  templateExams: { name: string; weightage?: string }[];
};

export type StructureVM = {
  id: string;
  name: string;
  terms: StructureTermVM[];
};

export type ExaminationsViewModel = {
  /** Non-null only when API returned `data.class` */
  classInfo: Record<string, unknown> | null;
  classLabel: string;
  academicYear?: string;
  structures: StructureVM[];
  examinations: NormalizedExam[];
};

export type ExamMarksBlock = {
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  passFail: 'pass' | 'fail' | 'unknown';
  remarks?: string;
};

function str(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function numOrUndef(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function pickName(row: Record<string, unknown>): string {
  return (
    str(row.name) ||
    str(row.title) ||
    str(row.exam_name) ||
    str(row.examination_name) ||
    str(row.term_name) ||
    str(row.structure_name) ||
    '—'
  );
}

function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

/** End of calendar day (local) for YYYY-MM-DD string */
function endOfDayMs(dateStr: string): number {
  const d = new Date(`${dateStr}T23:59:59.999`);
  return d.getTime();
}

function startOfDayMs(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00.000`);
  return d.getTime();
}

export function formatUsShortDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    });
  } catch {
    return d;
  }
}

export function formatUsShortRange(start?: string, end?: string): string {
  if (!start && !end) return '—';
  if (start && end && start !== end) {
    return `${formatUsShortDate(start)} – ${formatUsShortDate(end)}`;
  }
  return formatUsShortDate(start || end);
}

function normSubjectKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function teacherFromRow(row: Record<string, unknown>): string {
  const direct =
    str(row.teacher_name) ||
    str(row.staff_name) ||
    str(row.faculty_name) ||
    str(row.class_teacher_name) ||
    str(row.teacher);
  if (direct) return direct;
  const t = row.teacher;
  if (t && typeof t === 'object') {
    const o = t as Record<string, unknown>;
    return str(o.name) || str(o.full_name) || str(o.teacher_name) || '';
  }
  const st = row.staff;
  if (st && typeof st === 'object') {
    const o = st as Record<string, unknown>;
    return str(o.name) || str(o.full_name) || '';
  }
  return '';
}

function dateTimeFromMappingRow(row: Record<string, unknown>): string {
  const date =
    str(row.exam_date) ||
    str(row.schedule_date) ||
    str(row.scheduled_date) ||
    str(row.date) ||
    str(row.examination_date);
  const st = str(row.start_time) || str(row.start);
  const en = str(row.end_time) || str(row.end);
  const time =
    str(row.time) ||
    (st && en ? `${st} – ${en}` : st || en) ||
    '';
  if (date && time) return `${formatUsShortDate(date)} · ${time}`;
  if (date) return formatUsShortDate(date);
  if (time) return time;
  return '';
}

function schedulesFromRaw(raw: unknown): ExamScheduleRow[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[])
    .map((row) => {
      const nested =
        row.schedule && typeof row.schedule === 'object'
          ? (row.schedule as Record<string, unknown>)
          : null;
      const n = (k: string) => str(row[k]) || (nested ? str(nested[k]) : '');
      const subject =
        str(row.subject) ||
        str(row.subject_name) ||
        str(row.name) ||
        str((row.subject_id as { name?: string } | undefined)?.name);
      const date =
        n('date') ||
        n('exam_date') ||
        n('schedule_date') ||
        n('scheduled_date') ||
        n('slot_date');
      const start = n('start_time') || n('start');
      const end = n('end_time') || n('end');
      const time =
        n('time') ||
        (start && end ? `${start} – ${end}` : start || end) ||
        undefined;
      let teacher = teacherFromRow(row);
      if (!teacher && nested) teacher = teacherFromRow(nested);
      return {
        subject: subject || '—',
        subject_name: str(row.subject_name) || undefined,
        subject_id: str(row.subject_id) || undefined,
        date: date || undefined,
        exam_date: n('exam_date') || undefined,
        time,
        start_time: start || undefined,
        end_time: end || undefined,
        teacher_name: teacher || undefined,
        room: str(row.room) || str(row.hall) || undefined,
      };
    })
    .filter((r) => r.subject && r.subject !== '—');
}

function matchSchedule(
  subjectName: string,
  subjectId: string | undefined,
  schedules: ExamScheduleRow[],
  index: number
): ExamScheduleRow | undefined {
  if (subjectId) {
    const byId = schedules.find((s) => str(s.subject_id) === subjectId);
    if (byId) return byId;
  }
  const key = normSubjectKey(subjectName);
  const byName = schedules.find(
    (s) => normSubjectKey(s.subject_name || s.subject) === key
  );
  if (byName) return byName;
  const fuzzy = schedules.find((s) => {
    const sk = normSubjectKey(s.subject_name || s.subject);
    return sk.includes(key) || key.includes(sk);
  });
  if (fuzzy) return fuzzy;
  return schedules[index] ?? schedules[0];
}

function buildDateTimeLine(sch?: ExamScheduleRow): string {
  if (!sch) return '—';
  const date = sch.exam_date || sch.date;
  const datePart = date ? formatUsShortDate(date) : '—';
  const st = sch.start_time || '';
  const en = sch.end_time || '';
  const timePart =
    sch.time ||
    (st && en ? `${st} – ${en}` : st || en) ||
    '';
  if (timePart) return `${datePart} · ${timePart}`;
  return datePart;
}

function subjectRowsFromExam(
  exam: Record<string, unknown>,
  schedules: ExamScheduleRow[]
): SubjectTableRow[] {
  const raw =
    exam.subject_mappings ??
    exam.subjectMappings ??
    exam.exam_subject_mappings ??
    [];
  if (!Array.isArray(raw) || raw.length === 0) return [];

  return (raw as Record<string, unknown>[]).map((row, i) => {
    const subject_name =
      str(row.subject_name) ||
      str(row.subject) ||
      str(row.name) ||
      '—';
    const subjectId = str(row.subject_id);
    const sch = matchSchedule(subject_name, subjectId || undefined, schedules, i);
    const maxN = numOrUndef(row.max_marks);
    const passN = numOrUndef(row.pass_marks);
    const fromMap = dateTimeFromMappingRow(row);
    const fromSch = buildDateTimeLine(sch);
    const dateTimeLine =
      fromSch !== '—' ? fromSch : fromMap || '—';
    const teacher =
      teacherFromRow(row) || sch?.teacher_name || undefined;
    return {
      subject_name,
      teacher_name: teacher || undefined,
      max_marks: maxN != null ? String(maxN) : str(row.max_marks) || undefined,
      pass_marks: passN != null ? String(passN) : str(row.pass_marks) || undefined,
      dateTimeLine,
    };
  });
}

function buildTermNameMap(
  termsFlat: Record<string, unknown>[],
  structureBundles: unknown[]
): Map<string, string> {
  const m = new Map<string, string>();
  for (const row of termsFlat) {
    const id = str(row.id) || str(row.term_id);
    if (!id) continue;
    const name = pickName(row);
    if (name && name !== '—') m.set(id, name);
  }
  for (const bundle of structureBundles) {
    if (!bundle || typeof bundle !== 'object') continue;
    const terms = (bundle as Record<string, unknown>).terms;
    if (!Array.isArray(terms)) continue;
    for (const t of terms) {
      if (!t || typeof t !== 'object') continue;
      const tr = t as Record<string, unknown>;
      const id = str(tr.id) || str(tr.term_id);
      if (!id) continue;
      const name = pickName(tr);
      if (name && name !== '—') m.set(id, name);
    }
  }
  return m;
}

function normalizeOneExam(
  exam: Record<string, unknown>,
  i: number,
  termById: Map<string, string>
): NormalizedExam {
  const id =
    str(exam.id) ||
    str(exam.exam_id) ||
    str(exam.examination_id) ||
    `exam-${i}`;
  let schedules = schedulesFromRaw(
    exam.schedules ??
      exam.exam_schedules ??
      exam.subject_schedule ??
      exam.schedule_list ??
      exam.timetable
  );
  const mappingsRaw =
    exam.subject_mappings ??
    exam.subjectMappings ??
    exam.exam_subject_mappings;
  if (schedules.length === 0 && Array.isArray(mappingsRaw)) {
    schedules = schedulesFromRaw(mappingsRaw);
  }
  if (schedules.length === 0) {
    schedules = schedulesFromRaw(exam.subjects);
  }
  const subjectRows = subjectRowsFromExam(exam, schedules);

  const termEmbed = exam.term as Record<string, unknown> | string | undefined;
  const termId = str(exam.term_id);
  let termName =
    str(exam.term_name) ||
    str(exam.examination_term) ||
    str(exam.term_label) ||
    (termId ? termById.get(termId) : '') ||
    '';
  if (typeof termEmbed === 'string' && termEmbed.trim()) {
    termName = termEmbed.trim();
  } else if (termEmbed && typeof termEmbed === 'object') {
    const tn = pickName(termEmbed as Record<string, unknown>);
    if (tn && tn !== '—') termName = tn;
  }
  const termNameFinal: string | undefined = termName ? termName : undefined;

  const totalMax = numOrUndef(exam.total_max_marks);
  const totalPass = numOrUndef(exam.total_pass_marks);

  return {
    id,
    name:
      str(exam.exam_name) ||
      str(exam.name) ||
      str(exam.title) ||
      pickName(exam),
    startDate: str(exam.start_date) || undefined,
    endDate: str(exam.end_date) || undefined,
    examDate: str(exam.exam_date) || undefined,
    academicYear:
      str(exam.academic_year) || str(exam.academicYear) || undefined,
    description: str(exam.description) || undefined,
    termName: termNameFinal,
    structureName: str(exam.structure_name) || undefined,
    status: str(exam.status) || undefined,
    schedules,
    subjectRows,
    totalMaxMarks: totalMax,
    totalPassMarks: totalPass,
    dateSheetUrl: str(exam.date_sheet_url) || str(exam.date_sheet) || undefined,
  };
}

function isBundleStructureRow(row: unknown): boolean {
  if (!row || typeof row !== 'object') return false;
  const r = row as Record<string, unknown>;
  return (
    r.structure != null &&
    typeof r.structure === 'object' &&
    Array.isArray(r.terms)
  );
}

/** e.g. { id, name, terms: [...] } without nested `structure` */
function isFlatStructureWithTermsRow(row: unknown): boolean {
  if (!row || typeof row !== 'object') return false;
  const r = row as Record<string, unknown>;
  if (!Array.isArray(r.terms)) return false;
  if (r.structure != null && typeof r.structure === 'object') return false;
  return true;
}

function mapTermsRawToVM(
  termsRaw: unknown[],
  structIndex: number
): StructureTermVM[] {
  return termsRaw
    .map((t, ti) => {
      if (!t || typeof t !== 'object') return null;
      const tr = t as Record<string, unknown>;
      const serial =
        tr.serial != null && tr.serial !== ''
          ? String(tr.serial)
          : String(ti + 1);
      const rawName = pickName(tr);
      const name = rawName === '—' ? `Term ${serial}` : rawName;
      const templates = tr.template_exams ?? tr.templateExams ?? [];
      const templateExams: { name: string; weightage?: string }[] = [];
      if (Array.isArray(templates)) {
        for (const te of templates) {
          if (!te || typeof te !== 'object') continue;
          const e = te as Record<string, unknown>;
          const en = str(e.exam_name) || pickName(e);
          if (!en || en === '—') continue;
          const w = e.weightage ?? e.weight;
          templateExams.push({
            name: en,
            weightage: w != null ? String(w) : undefined,
          });
        }
      }
      return {
        id: str(tr.id) || `term-${structIndex}-${ti}`,
        serial,
        name,
        templateExams,
      };
    })
    .filter((x): x is StructureTermVM => x != null);
}

function parseFlatStructureBundles(raw: unknown[]): StructureVM[] {
  return raw
    .map((row, si) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const stId = str(r.id) || `struct-${si}`;
      const nm = pickName(r);
      const stName = nm === '—' ? 'Exam structure' : nm;
      const termsRaw = r.terms as unknown[];
      const terms = mapTermsRawToVM(termsRaw, si);
      return { id: stId, name: stName, terms };
    })
    .filter((s): s is StructureVM => s != null);
}

function parseBundleStructures(raw: unknown[]): StructureVM[] {
  return raw
    .map((row, si) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const st = r.structure as Record<string, unknown>;
      const stName =
        (st && (str(st.name) || pickName(st))) || 'Exam structure';
      const stId = str(st?.id) || `struct-${si}`;
      const termsRaw = r.terms as unknown[];
      const terms = mapTermsRawToVM(termsRaw, si);
      return { id: stId, name: stName, terms };
    })
    .filter((s): s is StructureVM => s != null);
}

/** When API omits structure rows but returns exam_terms / terms. */
function buildStructuresFromTermsOnly(
  termsRaw: Record<string, unknown>[],
  termExamsRaw: unknown[]
): StructureVM[] {
  const termExamsByTerm: Record<string, { name: string; weightage?: string }[]> =
    {};
  for (const row of termExamsRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const tid = str(r.term_id) || str(r.exam_term_id);
    if (!tid) continue;
    if (!termExamsByTerm[tid]) termExamsByTerm[tid] = [];
    const w = r.weightage ?? r.weight;
    termExamsByTerm[tid].push({
      name: pickName(r),
      weightage: w != null ? String(w) : undefined,
    });
  }

  let idx = 0;
  const terms: StructureTermVM[] = [];
  for (const row of termsRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const tid = str(r.id) || str(r.term_id);
    if (!tid) continue;
    const serial = str(r.serial) || String(++idx);
    const nameRaw = pickName(r);
    const name = nameRaw === '—' ? `Term ${serial}` : nameRaw;
    terms.push({
      id: tid,
      serial,
      name,
      templateExams: termExamsByTerm[tid] ?? [],
    });
  }
  if (terms.length === 0) return [];
  return [{ id: 'exam-structure', name: 'Exam structure', terms }];
}

function buildStructuresLegacy(
  structuresRaw: unknown[],
  termsRaw: unknown[],
  termExamsRaw: unknown[]
): StructureVM[] {
  const termExamsByTerm: Record<string, { name: string; weightage?: string }[]> =
    {};
  for (const row of termExamsRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const tid = str(r.term_id) || str(r.exam_term_id);
    if (!tid) continue;
    if (!termExamsByTerm[tid]) termExamsByTerm[tid] = [];
    const w = r.weightage ?? r.weight;
    termExamsByTerm[tid].push({
      name: pickName(r),
      weightage: w != null ? String(w) : undefined,
    });
  }

  const termsByStructure: Record<string, StructureTermVM[]> = {};
  let termIndex = 0;
  for (const row of termsRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const sid =
      str(r.exam_term_structure_id) ||
      str(r.structure_id) ||
      str(r.exam_structure_id) ||
      '';
    if (!sid) continue;
    const tid = str(r.id) || str(r.term_id) || '';
    if (!tid) continue;
    const name = pickName(r);
    const serial = str(r.serial) || String(++termIndex);
    if (!termsByStructure[sid]) termsByStructure[sid] = [];
    termsByStructure[sid].push({
      id: tid,
      serial,
      name: name === '—' ? `Term ${serial}` : name,
      templateExams: termExamsByTerm[tid] ?? [],
    });
  }

  return structuresRaw
    .map((row, i) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const id = str(r.id) || `struct-${i}`;
      const nm = pickName(r);
      return {
        id,
        name: nm === '—' ? 'Exam structure' : nm,
        terms: termsByStructure[id] ?? [],
      };
    })
    .filter((s): s is StructureVM => s != null);
}

function unwrapPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data;
  if (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) {
    const inner = o.data as Record<string, unknown>;
    if (
      inner.examinations != null ||
      inner.class != null ||
      inner.structures != null ||
      inner.exam_term_structures != null ||
      inner.examination_structures != null ||
      inner.exam_structures != null ||
      Array.isArray(inner.exam_terms) ||
      Array.isArray(inner.terms)
    ) {
      return inner;
    }
  }
  const result = o.result;
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return unwrapPayload({ data: result });
  }
  return raw;
}

/** Upcoming / ongoing: end_date or start_date end-of-day ≥ start of today */
export function isExamUpcomingOrOngoing(exam: NormalizedExam): boolean {
  const ref = exam.endDate || exam.startDate || exam.examDate;
  if (!ref) return true;
  try {
    return endOfDayMs(ref) >= startOfToday().getTime();
  } catch {
    return true;
  }
}

function compareExamWithinGroup(a: NormalizedExam, b: NormalizedExam): number {
  const endA = a.endDate || a.startDate || a.examDate || '';
  const endB = b.endDate || b.startDate || b.examDate || '';
  if (!endA && !endB) return (a.name || '').localeCompare(b.name || '');
  if (!endA) return 1;
  if (!endB) return -1;
  if (endA === endB) return (a.name || '').localeCompare(b.name || '');
  return endB.localeCompare(endA);
}

export function sortExaminationsClient(exams: NormalizedExam[]): NormalizedExam[] {
  const upcoming = exams.filter(isExamUpcomingOrOngoing);
  const past = exams.filter((e) => !isExamUpcomingOrOngoing(e));
  upcoming.sort(compareExamWithinGroup);
  past.sort(compareExamWithinGroup);
  return [...upcoming, ...past];
}

const STATUS_ALIASES: Record<string, 'Upcoming' | 'Ongoing' | 'Completed'> = {
  upcoming: 'Upcoming',
  scheduled: 'Upcoming',
  pending: 'Upcoming',
  ongoing: 'Ongoing',
  'in progress': 'Ongoing',
  in_progress: 'Ongoing',
  active: 'Ongoing',
  completed: 'Completed',
  complete: 'Completed',
  past: 'Completed',
  closed: 'Completed',
};

export function deriveExamUiStatus(exam: NormalizedExam): 'Upcoming' | 'Ongoing' | 'Completed' {
  const s = exam.status?.toLowerCase().trim();
  if (s && STATUS_ALIASES[s]) return STATUS_ALIASES[s];

  const start = exam.startDate || exam.examDate;
  const end = exam.endDate || exam.examDate || exam.startDate;
  const today = startOfToday().getTime();
  if (start && end) {
    try {
      if (endOfDayMs(end) < today) return 'Completed';
      if (startOfDayMs(start) > today) return 'Upcoming';
      return 'Ongoing';
    } catch {
      /* fall through */
    }
  }
  if (end) {
    try {
      if (endOfDayMs(end) < today) return 'Completed';
      if (start && startOfDayMs(start) > today) return 'Upcoming';
      return 'Ongoing';
    } catch {
      return 'Upcoming';
    }
  }
  return 'Upcoming';
}

export function parseStudentExaminationsPayload(raw: unknown): ExaminationsViewModel {
  const payload = unwrapPayload(raw);

  if (Array.isArray(payload)) {
    const exams = (payload as Record<string, unknown>[]).map((e, i) =>
      normalizeOneExam(e, i, new Map())
    );
    return {
      classInfo: null,
      classLabel: '',
      academicYear: undefined,
      structures: [],
      examinations: sortExaminationsClient(exams),
    };
  }

  if (!payload || typeof payload !== 'object') {
    return {
      classInfo: null,
      classLabel: '',
      academicYear: undefined,
      structures: [],
      examinations: [],
    };
  }

  const o = payload as Record<string, unknown>;
  const classRaw = o.class;
  const classInfo =
    classRaw && typeof classRaw === 'object' && !Array.isArray(classRaw)
      ? (classRaw as Record<string, unknown>)
      : null;

  const cls = classInfo ? str(classInfo.class) : '';
  const sec = classInfo ? str(classInfo.section) : '';
  const year = classInfo
    ? str(classInfo.academic_year) || str(classInfo.academicYear)
    : '';
  const classLabel =
    cls && sec
      ? `Class ${cls} · Section ${sec}`
      : cls
        ? `Class ${cls}`
        : sec
          ? `Section ${sec}`
          : '';
  const academicYear = year || undefined;

  const structuresRaw = (
    o.structures ??
    o.exam_term_structures ??
    o.examination_structures ??
    o.exam_structures ??
    []
  ) as unknown[];
  const termsFlat = (o.exam_terms ??
    o.terms ??
    o.examination_terms ??
    []) as Record<string, unknown>[];
  const termExamsRaw = (o.exam_term_exams ?? o.term_exams ?? []) as unknown[];

  let structures: StructureVM[] = [];
  if (Array.isArray(structuresRaw) && structuresRaw.length > 0) {
    if (isBundleStructureRow(structuresRaw[0])) {
      structures = parseBundleStructures(structuresRaw);
    } else if (isFlatStructureWithTermsRow(structuresRaw[0])) {
      structures = parseFlatStructureBundles(structuresRaw);
    } else {
      structures = buildStructuresLegacy(
        structuresRaw,
        termsFlat,
        termExamsRaw
      );
    }
  }
  if (structures.length === 0 && termsFlat.length > 0) {
    structures = buildStructuresFromTermsOnly(termsFlat, termExamsRaw);
  }

  const termById = buildTermNameMap(termsFlat, structuresRaw);

  const listRaw = o.examinations ?? o.scheduled_examinations ?? o.exams;
  const examsArr = Array.isArray(listRaw)
    ? (listRaw as Record<string, unknown>[]).map((e, i) =>
        normalizeOneExam(e, i, termById)
      )
    : [];

  return {
    classInfo,
    classLabel,
    academicYear,
    structures,
    examinations: sortExaminationsClient(examsArr),
  };
}

/**
 * Marks API → map by exam id (only exams present in payload).
 */
export function parseMarksByExamId(body: unknown): Record<string, ExamMarksBlock> {
  const root = body as Record<string, unknown> | null;
  const data = root?.data;
  if (!Array.isArray(data)) return {};

  const out: Record<string, ExamMarksBlock> = {};
  for (const exam of data as Record<string, unknown>[]) {
    const examId = str(exam.exam_id ?? exam.id);
    if (!examId) continue;

    const subjectsRaw = exam.subjects;
    if (!Array.isArray(subjectsRaw) || subjectsRaw.length === 0) continue;

    let totalObtained = numOrUndef(exam.total_marks);
    let totalMax = numOrUndef(exam.total_max_marks);
    const pctApi = numOrUndef(exam.overall_percentage);
    let grade = str(exam.overall_grade).toUpperCase().charAt(0) || '';

    const subj: { marks: number; max: number }[] = [];
    for (const row of subjectsRaw as Record<string, unknown>[]) {
      const marksNum =
        Number(row.marks_obtained ?? row.marks ?? row.obtained ?? 0) || 0;
      const maxNum = Number(row.max_marks ?? row.max ?? 100) || 100;
      subj.push({ marks: marksNum, max: maxNum });
    }

    if (totalObtained == null) {
      totalObtained = subj.reduce((s, x) => s + x.marks, 0);
    }
    if (totalMax == null || totalMax === 0) {
      totalMax = subj.reduce((s, x) => s + x.max, 0);
    }

    const percentage =
      pctApi != null
        ? Math.round(pctApi)
        : totalMax > 0
          ? Math.round((totalObtained / totalMax) * 100)
          : 0;

    if (!grade) {
      if (percentage >= 90) grade = 'A';
      else if (percentage >= 80) grade = 'B';
      else if (percentage >= 70) grade = 'C';
      else if (percentage >= 60) grade = 'D';
      else grade = 'F';
    }

    const remarks = str(exam.remarks) || str(exam.overall_remarks) || undefined;

    let passFail: 'pass' | 'fail' | 'unknown' = 'unknown';
    const overallStatus = str(exam.overall_status ?? exam.result_status).toLowerCase();
    if (overallStatus.includes('fail')) passFail = 'fail';
    else if (overallStatus.includes('pass')) passFail = 'pass';
    else if (percentage >= 40) passFail = 'pass';
    else if (totalMax > 0) passFail = 'fail';

    out[examId] = {
      totalObtained,
      totalMax: totalMax || 0,
      percentage,
      grade,
      passFail,
      remarks,
    };
  }
  return out;
}

export function buildDateSheetHtml(exam: NormalizedExam): string {
  const rows =
    exam.subjectRows.length > 0
      ? exam.subjectRows
      : exam.schedules.map((s) => ({
          subject_name: s.subject_name || s.subject,
          teacher_name: s.teacher_name,
          max_marks: undefined as string | undefined,
          pass_marks: undefined as string | undefined,
          dateTimeLine: buildDateTimeLine(s),
        }));

  const head = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(
    exam.name
  )}</title></head><body>`;
  const title = `<h1>${escapeHtml(exam.name)}</h1>`;
  const range = `<p>${escapeHtml(formatUsShortRange(exam.startDate, exam.endDate))}</p>`;
  const tableHead =
    '<table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Subject</th><th>Date / time</th><th>Teacher</th><th>Max</th><th>Pass</th></tr></thead><tbody>';
  const tableBody = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.subject_name)}</td><td>${escapeHtml(
          r.dateTimeLine
        )}</td><td>${escapeHtml(r.teacher_name ?? '—')}</td><td>${escapeHtml(
          r.max_marks ?? '—'
        )}</td><td>${escapeHtml(r.pass_marks ?? '—')}</td></tr>`
    )
    .join('');
  const foot = '</tbody></table>';
  const totals =
    exam.totalMaxMarks != null || exam.totalPassMarks != null
      ? `<p><strong>Total max:</strong> ${exam.totalMaxMarks ?? '—'} &nbsp; <strong>Total pass:</strong> ${exam.totalPassMarks ?? '—'}</p>`
      : '';
  return `${head}${title}${range}${tableHead}${tableBody}${foot}${totals}</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
