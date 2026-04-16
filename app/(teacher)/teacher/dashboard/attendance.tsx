/**
 * Teacher: Mark Attendance
 * Matches design: class pills, date row, mark-all buttons,
 * student cards (Present / Absent / Late), progress footer, save button.
 */

import { useTeacher } from '@/lib/teacher-context';
import type { TeacherClassRow as ClassRow } from '@/lib/teacher-class-roster';
import {
  unwrapSchoolClassesPayload,
  enrichTeacherClassesFromSchool,
  classPillLabel,
  rosterClassQueryParam,
  looksLikeUuid,
  normalizeTeacherClassesFromApi,
} from '@/lib/teacher-class-roster';
import { useToastStore } from '@/lib/toast';
import { schoolService } from '@/services/school.service';
import { teacherService } from '@/services/teacher.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────
const G = {
  green:        '#22C55E',
  greenLight:   '#DCFCE7',
  greenDark:    '#16A34A',
  red:          '#EF4444',
  redLight:     '#FEE2E2',
  slate:        '#64748B',
  slateLight:   '#F1F5F9',
  slateBorder:  '#E2E8F0',
  textDark:     '#0F172A',
  textMid:      '#475569',
  textLight:    '#94A3B8',
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  late:         '#3B82F6',
  lateBg:       '#EFF6FF',
};

type AttendanceStatus = 'present' | 'absent' | 'late';

type StudentRow = { id: string; student_id?: string; name?: string; admission_no?: string; photo_url?: string; [k: string]: unknown };

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Unwrap class attendance API: roster may be empty until GET /api/students is merged in. */
function normalizeAttendanceStudents(raw: unknown): StudentRow[] {
  if (!raw || typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.students)) return o.students as StudentRow[];
  if (Array.isArray(o.data)) return o.data as StudentRow[];
  const data = o.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.students)) return d.students as StudentRow[];
    if (Array.isArray(d.records)) return d.records as StudentRow[];
    if (Array.isArray(d.data)) return d.data as StudentRow[];
  }
  if (Array.isArray(o.records)) return o.records as StudentRow[];
  return [];
}

function normalizeRosterStudents(raw: unknown): StudentRow[] {
  if (Array.isArray(raw)) return raw as StudentRow[];
  if (!raw || typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data as StudentRow[];
  if (Array.isArray(o.students)) return o.students as StudentRow[];
  const d = o.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const inner = d as Record<string, unknown>;
    if (Array.isArray(inner.data)) return inner.data as StudentRow[];
    if (Array.isArray(inner.students)) return inner.students as StudentRow[];
  }
  return [];
}

function studentRowId(s: StudentRow): string {
  return String(s.id ?? s.student_id ?? '').trim();
}

function mergeRosterAndAttendance(roster: StudentRow[], fromAttendance: StudentRow[]): StudentRow[] {
  const byId = new Map<string, StudentRow>();
  for (const s of roster) {
    const id = studentRowId(s);
    if (!id) continue;
    byId.set(id, { ...s, id });
  }
  for (const s of fromAttendance) {
    const id = studentRowId(s);
    if (!id) continue;
    const prev = byId.get(id);
    const status = (s as { status?: string }).status;
    if (prev) {
      byId.set(id, { ...prev, ...s, id, ...(status != null ? { status } : {}) });
    } else {
      byId.set(id, { ...s, id: s.id ?? s.student_id ?? id });
    }
  }
  return Array.from(byId.values());
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const isToday = dateStr === todayStr();
    const base = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return isToday ? `Today, ${base}` : base;
  } catch {
    return dateStr;
  }
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#FDE68A', '#BBF7D0', '#BFDBFE', '#FCA5A5', '#DDD6FE'];

function Avatar({ name, index }: { name?: string; index: number }) {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <View style={[styles.avatar, { backgroundColor: bg }]}>
      <Text style={styles.avatarText}>{getInitials(name)}</Text>
    </View>
  );
}

// ─── Student Card ─────────────────────────────────────────────────────────────
function StudentCard({
  student,
  index,
  status,
  onChange,
}: {
  student: StudentRow;
  index: number;
  status: AttendanceStatus;
  onChange: (id: string, status: AttendanceStatus) => void;
}) {
  const sid = student.id ?? student.student_id ?? '';

  const statusConfig: Record<AttendanceStatus, { label: string; icon: string; bg: string; text: string; dot: string }> = {
    present: { label: 'Present', icon: '✓', bg: G.green,    text: '#fff',     dot: G.green },
    absent:  { label: 'Absent',  icon: '✕', bg: G.red,      text: '#fff',     dot: G.red   },
    late:    { label: 'Late',    icon: '🕐', bg: G.late,     text: '#fff',     dot: G.late  },
  };

  const dotColor = statusConfig[status].dot;

  return (
    <View style={styles.studentCard}>
      {/* Top: avatar + name + info icon */}
      <View style={styles.studentCardTop}>
        <View style={{ position: 'relative' }}>
          <Avatar name={student.name} index={index} />
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name ?? 'Student'}</Text>
          {student.admission_no ? (
            <Text style={styles.admissionNo}>Admission No: {student.admission_no}</Text>
          ) : null}
        </View>

        <Pressable style={styles.infoBtn} hitSlop={8}>
          <Text style={styles.infoBtnText}>ℹ</Text>
        </Pressable>
      </View>

      {/* Toggle row */}
      <View style={styles.toggleRow}>
        {(['present', 'absent', 'late'] as AttendanceStatus[]).map((s) => {
          const cfg = statusConfig[s];
          const active = status === s;
          return (
            <Pressable
              key={s}
              onPress={() => onChange(sid, s)}
              style={[
                styles.toggleBtn,
                active && { backgroundColor: cfg.bg },
                !active && styles.toggleBtnInactive,
              ]}
            >
              <Text style={[styles.toggleIcon, active && { color: cfg.text }]}>
                {cfg.icon}
              </Text>
              <Text style={[styles.toggleLabel, active && { color: cfg.text }]}>
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TeacherMarkAttendanceScreen() {
  const router     = useRouter();
  const { schoolCode, teacher } = useTeacher();
  const showToast  = useToastStore((s) => s.show);
  const queryClient = useQueryClient();

  const [classId,    setClassId]    = useState('');
  const [date,       setDate]       = useState(todayStr());
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isMarked,   setIsMarked]   = useState(false);

  // ── Classes (send both teacher_id and staff_id so backend matches website behaviour) ──
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacher?.id, teacher?.staff_id],
    queryFn: () =>
      teacherService
        .getClasses({
          school_code: schoolCode,
          teacher_id: teacher?.id ?? '',
          staff_id: teacher?.staff_id,
          array: true,
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && (teacher?.id || teacher?.staff_id)),
  });
  const { data: schoolClassesPayload, isLoading: loadingSchoolClasses } = useQuery({
    queryKey: ['school', 'classes', schoolCode, 'mark-attendance-enrich'],
    queryFn: () => schoolService.getClasses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
    staleTime: 60_000,
  });

  const teacherClassesBase = useMemo(() => normalizeTeacherClassesFromApi(classesData), [classesData]);

  const schoolClassesList = useMemo(() => unwrapSchoolClassesPayload(schoolClassesPayload), [schoolClassesPayload]);

  const classesList = useMemo(
    () => enrichTeacherClassesFromSchool(teacherClassesBase, schoolClassesList),
    [teacherClassesBase, schoolClassesList]
  );
  const hasAssignedClasses = classesList.length > 0;

  // Auto-select first class
  useEffect(() => {
    if (!classId && classesList.length > 0) {
      setClassId(String(classesList[0].id));
    }
  }, [classesList, classId]);

  const selectedClass = useMemo(
    () => classesList.find((c) => String(c.id) === String(classId)),
    [classesList, classId]
  );

  // ── Existing marks + names (may be empty before any attendance exists) ──
  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', 'class', schoolCode, classId, date],
    queryFn: () =>
      schoolService
        .getAttendanceClass(schoolCode, { class_id: classId, date })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && classId && date),
  });

  // ── Full class roster (required per staff dashboard API doc) ──
  /** Match `students.class` / section / academic_year — never use class UUID as `class` query. */
  const rosterClassParam = rosterClassQueryParam(selectedClass);

  const rosterQueryOk =
    Boolean(schoolCode && classId && selectedClass) &&
    Boolean(rosterClassParam) &&
    !looksLikeUuid(rosterClassParam);

  const { data: rosterData, isLoading: loadingRoster } = useQuery({
    queryKey: [
      'students',
      'class-roster',
      schoolCode,
      classId,
      rosterClassParam,
      selectedClass?.section ?? '',
      selectedClass?.academic_year ?? '',
    ],
    queryFn: () => {
      const params: { class: string; section?: string; academic_year?: string; status?: string } = {
        class: rosterClassParam,
        status: 'active',
      };
      const sec = selectedClass?.section;
      if (sec != null && String(sec).trim()) params.section = String(sec).trim();
      const ay = selectedClass?.academic_year;
      if (ay != null && String(ay).trim()) params.academic_year = String(ay).trim();
      return schoolService.getStudents(schoolCode, params).then((r) => r.data);
    },
    enabled: rosterQueryOk,
  });

  const students = useMemo(() => {
    const roster = normalizeRosterStudents(rosterData);
    const fromAtt = normalizeAttendanceStudents(attendanceData);
    const merged = mergeRosterAndAttendance(roster, fromAtt);
    return merged.map((s) => ({
      ...s,
      name:
        s.name ??
        (s as { student_name?: string }).student_name ??
        (s as { full_name?: string }).full_name,
    }));
  }, [rosterData, attendanceData]);

  const loadingStudents =
    loadingAttendance || loadingRoster || (Boolean(schoolCode && hasAssignedClasses) && loadingSchoolClasses);

  const rosterBlocked =
    Boolean(classId && selectedClass) &&
    !rosterQueryOk &&
    !loadingClasses &&
    !loadingSchoolClasses &&
    !loadingRoster &&
    !loadingAttendance;

  // Seed attendance from API (existing records)
  useEffect(() => {
    if (!students.length) return;
    setAttendance((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        const sid = s.id ?? s.student_id ?? '';
        if (!next[sid]) {
          // Use server-provided status if available, else default present
          const serverStatus = (s as { status?: string }).status as AttendanceStatus | undefined;
          next[sid] = serverStatus ?? 'present';
        }
      });
      return next;
    });
    setIsMarked(false);
  }, [students]);

  // ── Mark All ──
  const markAll = useCallback((status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      const sid = s.id ?? s.student_id ?? '';
      next[sid] = status;
    });
    setAttendance(next);
  }, [students]);

  // ── Progress ──
  const markedCount = useMemo(
    () => students.filter((s) => attendance[s.id ?? s.student_id ?? '']).length,
    [students, attendance],
  );
  const progressPct = students.length > 0 ? Math.round((markedCount / students.length) * 100) : 0;
  const allMarked   = progressPct === 100;

  // ── Save ──
  const mutation = useMutation({
    mutationFn: (body: {
      school_code: string;
      class_id: string;
      date: string;
      attendance: Array<{ student_id: string; status: string }>;
    }) => teacherService.updateAttendance(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'class', schoolCode, classId, date] });
      showToast('Attendance saved successfully', 'success');
      setIsMarked(true);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Save failed', 'error');
    },
  });

  const handleSave = useCallback(() => {
    if (!classId || !date) {
      showToast('Select class and date', 'error');
      return;
    }
    const list = students
      .map((s) => ({
        student_id: s.id ?? s.student_id ?? '',
        status: attendance[s.id ?? s.student_id ?? ''] ?? 'present',
      }))
      .filter((x) => x.student_id);
    mutation.mutate({ school_code: schoolCode, class_id: classId, date, attendance: list });
  }, [schoolCode, classId, date, students, attendance, mutation, showToast]);

  // ─────────────────────────────────────────────────────────────────────────────
  if (!loadingClasses && !hasAssignedClasses) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBackBtn}>
            <Text style={styles.headerBackIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
          <View style={styles.moreBtn} />
        </View>
        <View style={styles.scroll}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyTitle}>Not assigned as class teacher</Text>
            <Text style={styles.emptySub}>Mark attendance is available only when you are assigned as class teacher of a class.</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBackBtn}>
          <Text style={styles.headerBackIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <Pressable style={styles.moreBtn} hitSlop={12}>
          <Text style={styles.moreBtnText}>•••</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Class Selector Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classPillRow}
        >
          {classesList.map((c) => {
            const active = String(classId) === String(c.id);
            return (
              <Pressable
                key={String(c.id)}
                onPress={() => {
                  setClassId(String(c.id));
                  setAttendance({});
                  setIsMarked(false);
                }}
                style={[styles.classPill, active && styles.classPillActive]}
              >
                <Text style={[styles.classPillText, active && styles.classPillTextActive]}>
                  {classPillLabel(c)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.divider} />

        {/* ── Date Row ── */}
        <View style={styles.dateRow}>
          <Pressable style={styles.datePill}>
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
            <Text style={styles.dateChevron}>▾</Text>
          </Pressable>

          <View style={styles.markedStatus}>
            <View
              style={[
                styles.markedDot,
                { backgroundColor: isMarked ? G.green : G.textLight },
              ]}
            />
            <Text style={styles.markedLabel}>
              {isMarked ? 'MARKED' : 'NOT MARKED'}
            </Text>
          </View>
        </View>

        {/* ── Mark All Buttons ── */}
        {students.length > 0 && (
          <View style={styles.markAllRow}>
            <Pressable
              style={[styles.markAllBtn, styles.markAllBtnPresent]}
              onPress={() => markAll('present')}
            >
              <View style={styles.markAllIcon}>
                <Text style={styles.markAllIconText}>✓</Text>
              </View>
              <Text style={styles.markAllText}>MARK ALL{'\n'}PRESENT</Text>
            </Pressable>

            <Pressable
              style={[styles.markAllBtn, styles.markAllBtnAbsent]}
              onPress={() => markAll('absent')}
            >
              <View style={[styles.markAllIcon, styles.markAllIconAbsent]}>
                <Text style={styles.markAllIconText}>✕</Text>
              </View>
              <Text style={styles.markAllText}>MARK ALL{'\n'}ABSENT</Text>
            </Pressable>
          </View>
        )}

        {/* ── Student List ── */}
        {!classId ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏫</Text>
            <Text style={styles.emptyTitle}>Select a class</Text>
            <Text style={styles.emptySub}>Choose a class above to load students</Text>
          </View>
        ) : loadingStudents ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color={G.green} />
            <Text style={[styles.emptySub, { marginTop: 12 }]}>Loading students…</Text>
          </View>
        ) : students.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>
              {rosterBlocked ? 'Could not load class roster' : 'No students found'}
            </Text>
            <Text style={styles.emptySub}>
              {rosterBlocked
                ? 'This class has no grade/section linked in school records, or only an ID was returned. Confirm the class exists under Classes and matches student records.'
                : 'No students enrolled in this class'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.studentListLabel}>
              STUDENT LIST ({students.length})
            </Text>

            {students.map((s, i) => {
              const sid = s.id ?? s.student_id ?? '';
              return (
                <StudentCard
                  key={sid}
                  student={s}
                  index={i}
                  status={attendance[sid] ?? 'present'}
                  onChange={(id, status) =>
                    setAttendance((p) => ({ ...p, [id]: status }))
                  }
                />
              );
            })}

            {/* End of list */}
            <View style={styles.endOfList}>
              <Text style={styles.endIcon}>🎓</Text>
              <Text style={styles.endLabel}>End of class list</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Bottom: Progress + Save ── */}
      {students.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.progressRow}>
            <View>
              <Text style={styles.progressLabel}>ATTENDANCE PROGRESS</Text>
              <Text style={styles.progressCount}>
                Total Students: {students.length}
              </Text>
            </View>
            <Text
              style={[
                styles.progressPct,
                { color: allMarked ? G.green : G.slate },
              ]}
            >
              {allMarked ? '100% Complete' : `${progressPct}% Done`}
            </Text>
          </View>

          <Pressable
            style={[
              styles.saveBtn,
              mutation.isPending && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveBtnIcon}>💾</Text>
                <Text style={styles.saveBtnText}>Save Attendance</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: G.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: G.surface,
    borderBottomWidth: 1,
    borderBottomColor: G.slateBorder,
  },
  headerBackBtn: {
    width: 36,
    alignItems: 'center',
  },
  headerBackIcon: {
    fontSize: 28,
    color: G.textDark,
    fontWeight: '300',
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: G.textDark,
    letterSpacing: -0.2,
  },
  moreBtn: {
    width: 36,
    alignItems: 'center',
  },
  moreBtnText: {
    fontSize: 14,
    color: G.textMid,
    letterSpacing: 1,
  },

  scroll: {
    paddingBottom: 20,
  },

  // Class pills
  classPillRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    backgroundColor: G.surface,
  },
  classPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: G.slateLight,
  },
  classPillActive: {
    backgroundColor: G.green,
  },
  classPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: G.textMid,
  },
  classPillTextActive: {
    color: G.surface,
  },

  divider: {
    height: 1,
    backgroundColor: G.slateBorder,
  },

  // Date row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: G.surface,
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: G.slateBorder,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateIcon: {
    fontSize: 16,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: G.textDark,
  },
  dateChevron: {
    fontSize: 11,
    color: G.textLight,
    marginLeft: 2,
  },
  markedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  markedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: G.textLight,
    letterSpacing: 0.5,
  },

  // Mark All buttons
  markAllRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  markAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  markAllBtnPresent: {
    borderColor: G.green,
    backgroundColor: G.greenLight,
  },
  markAllBtnAbsent: {
    borderColor: G.slateBorder,
    backgroundColor: G.surface,
  },
  markAllIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: G.textDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllIconAbsent: {
    backgroundColor: G.textDark,
  },
  markAllIconText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: G.textDark,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 16,
  },

  // Student list header
  studentListLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: G.slate,
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },

  // Student card
  studentCard: {
    backgroundColor: G.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: G.slateBorder,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  studentCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: G.textDark,
  },
  statusDot: {
    position: 'absolute',
    bottom: 1,
    right: 11,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: G.surface,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: G.textDark,
    marginBottom: 2,
  },
  admissionNo: {
    fontSize: 12,
    color: G.textMid,
  },
  infoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: G.slateLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: {
    fontSize: 13,
    color: G.textMid,
    fontWeight: '600',
  },

  // Toggle row (Present / Absent / Late)
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: G.slateLight,
    borderRadius: 50,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 50,
    gap: 5,
  },
  toggleBtnInactive: {
    backgroundColor: 'transparent',
  },
  toggleIcon: {
    fontSize: 12,
    color: G.textMid,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: G.textMid,
  },

  // End of list
  endOfList: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  endIcon: {
    fontSize: 36,
    opacity: 0.4,
  },
  endLabel: {
    fontSize: 13,
    color: G.textLight,
  },

  // Footer
  footer: {
    backgroundColor: G.surface,
    borderTopWidth: 1,
    borderTopColor: G.slateBorder,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
    gap: 14,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: G.textLight,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '700',
    color: G.textDark,
  },
  progressPct: {
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: G.green,
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: G.green,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnIcon: {
    fontSize: 18,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: G.surface,
    letterSpacing: 0.2,
  },

  // Empty states
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: G.textDark,
  },
  emptySub: {
    fontSize: 13,
    color: G.textLight,
    textAlign: 'center',
  },
});