/**
 * My Class: hero (class/section/year), class teacher, timetable, classmates.
 * Same APIs as web: GET /api/student/class-teacher, GET /api/student/classmates,
 * GET /api/classes (fallback for class_id), GET timetable/slots.
 * Response shapes: result.data.class { id, class, section, academic_year }, result.data.class_teacher; result.data (array) for classmates.
 */

import { useAuthStore } from '@/lib/auth-store';
import { env } from '@/lib/env';
import { useStudent } from '@/lib/student-context';
import {
  getClassByExactMatch,
  getStaffById,
  getStudentByAdmissionNo,
  schoolService,
} from '@/services/school.service';
import { studentService } from '@/services/student.service';
import { timetableService } from '@/services/timetable.service';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const PRIMARY = '#2D62FF';
const BG_START = '#F6F9FF';
const BG_END = '#FFFFFF';
const CARD_BG = '#FFFFFF';
const BORDER = '#EEF2F7';
const TEXT = '#1E293B';
const MUTED = '#64748B';
const RADIUS = 22;
const RADIUS_SM = 16;
const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

/** Ensure value is a string; if API returns { id, name, color }, use .name */
function toStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && typeof (v as { name?: string }).name === 'string') return (v as { name: string }).name;
  return '';
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Normalize API day (Mon, Monday, monday) to full day name for matrix key */
function normalizeDay(day: string | undefined): string | undefined {
  if (!day || typeof day !== 'string') return undefined;
  const d = day.trim();
  const lower = d.toLowerCase();
  const map: Record<string, string> = {
    mon: 'Monday', monday: 'Monday',
    tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
    wed: 'Wednesday', wednesday: 'Wednesday',
    thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
    fri: 'Friday', friday: 'Friday',
    sat: 'Saturday', saturday: 'Saturday',
    sun: 'Sunday', sunday: 'Sunday',
  };
  return map[lower] ?? (DAYS.includes(d) ? d : undefined);
}

export default function StudentMyClassScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const clsFromProfile = toStr(student?.class) || String(student?.class ?? '');
  const sectionFromProfile = toStr(student?.section) || String(student?.section ?? '');
  const academicYearFromProfile = toStr(student?.academic_year) || String(student?.academic_year ?? '');

  const [searchQuery, setSearchQuery] = useState('');

  // When profile has no class/section (e.g. Supabase table auth), fetch full student so we have class, section, academic_year
  const needStudentFetch = Boolean(
    schoolCode &&
    (!clsFromProfile || !sectionFromProfile) &&
    (env.USE_SUPABASE_DASHBOARD ? !!student?.admission_no : !!studentId)
  );
  const {
    data: studentProfileRes,
    isLoading: loadingStudentProfile,
    isError: studentProfileError,
    refetch: refetchStudentProfile,
  } = useQuery({
    queryKey: ['student', 'profile', schoolCode, env.USE_SUPABASE_DASHBOARD ? student?.admission_no : studentId],
    queryFn: async () => {
      if (env.USE_SUPABASE_DASHBOARD && student?.admission_no) {
        const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
        const row = (r as { data?: Record<string, unknown> })?.data;
        return (typeof row === 'object' && row !== null ? row : {}) as Record<string, unknown>;
      }
      const r = await studentService.getById(studentId, schoolCode);
      const raw = r.data ?? r;
      const body = raw as Record<string, unknown>;
      const obj = body?.data ?? body?.student ?? body;
      return (typeof obj === 'object' && obj !== null ? obj : body) as Record<string, unknown>;
    },
    enabled: needStudentFetch,
  });

  const profileObj = studentProfileRes as Record<string, unknown> | undefined;
  const clsFromStudent =
    toStr(profileObj?.class) || toStr(profileObj?.class_name) || clsFromProfile;
  const sectionFromStudent =
    toStr(profileObj?.section) || toStr(profileObj?.section_name) || sectionFromProfile;
  const academicYearFromStudent =
    toStr(profileObj?.academic_year) || toStr(profileObj?.academic_year_name) || academicYearFromProfile;

  const setProfile = useAuthStore((s) => s.setProfile);
  useEffect(() => {
    if (!needStudentFetch || !profileObj) return;
    const cls = toStr(profileObj.class) || (profileObj.class_name as string);
    const section = toStr(profileObj.section) || (profileObj.section_name as string);
    const ay = toStr(profileObj.academic_year) || (profileObj.academic_year_name as string);
    if (cls || section || ay) {
      const current = useAuthStore.getState().profile ?? {};
      setProfile({ ...current, class: cls ?? current.class, section: section ?? current.section, academic_year: ay ?? current.academic_year });
    }
  }, [needStudentFetch, profileObj, setProfile]);

  const useSupabaseClass = env.USE_SUPABASE_DASHBOARD && Boolean(schoolCode && clsFromStudent && sectionFromStudent);

  // Supabase: single class by exact match (school_code, class, section, academic_year) — no partial filters
  const {
    data: supabaseClassRow,
    refetch: refetchSupabaseClass,
    isRefetching: refetchingSupabaseClass,
    isLoading: loadingSupabaseClass,
  } = useQuery({
    queryKey: ['supabase', 'class', schoolCode, clsFromStudent, sectionFromStudent, academicYearFromStudent],
    queryFn: async () => {
      const r = await getClassByExactMatch(
        schoolCode,
        clsFromStudent,
        sectionFromStudent,
        academicYearFromStudent || ''
      );
      const row = (r as { data?: Record<string, unknown> | null })?.data;
      return (row ?? null) as Record<string, unknown> | null;
    },
    enabled: useSupabaseClass,
  });

  const classTeacherIdFromSupabase = supabaseClassRow?.class_teacher_id != null ? String(supabaseClassRow.class_teacher_id) : '';

  // Supabase: class teacher from staff table by class_teacher_id
  const {
    data: supabaseStaffRow,
    refetch: refetchSupabaseStaff,
    isRefetching: refetchingSupabaseStaff,
    isLoading: loadingSupabaseStaff,
  } = useQuery({
    queryKey: ['supabase', 'staff', schoolCode, classTeacherIdFromSupabase],
    queryFn: async () => {
      const r = await getStaffById(schoolCode, classTeacherIdFromSupabase);
      const row = (r as { data?: Record<string, unknown> | null })?.data;
      return (row ?? null) as Record<string, unknown> | null;
    },
    enabled: useSupabaseClass && !!classTeacherIdFromSupabase,
  });

  // Same API as web: GET /api/student/class-teacher (used when !USE_SUPABASE_DASHBOARD)
  const {
    data: classTeacherRes,
    refetch: refetchCT,
    isRefetching: refetchingCT,
    isLoading: loadingCT,
  } = useQuery({
    queryKey: ['student', 'class-teacher', schoolCode, clsFromStudent, sectionFromStudent, academicYearFromStudent],
    queryFn: async () => {
      const r = await studentService.getClassTeacher({
        school_code: schoolCode,
        class: clsFromStudent,
        section: sectionFromStudent,
        academic_year: academicYearFromStudent,
      });
      return (r.data ?? r) as Record<string, unknown>;
    },
    enabled: !env.USE_SUPABASE_DASHBOARD && Boolean(schoolCode && clsFromStudent && sectionFromStudent),
  });

  // Parse: from API (class-teacher response) or from Supabase (exact class + staff)
  const body = classTeacherRes as Record<string, unknown> | undefined;
  const data = body?.data as Record<string, unknown> | undefined;
  const apiClassFromApi = data?.class as Record<string, unknown> | undefined;
  const apiClass = useSupabaseClass ? (supabaseClassRow ?? undefined) : apiClassFromApi;
  const classIdFromApi = apiClass?.id != null ? String(apiClass.id) : '';
  const cls = toStr(apiClass?.class) || toStr(apiClass) || clsFromStudent;
  const section = toStr(apiClass?.section) || sectionFromStudent;
  const academicYear = toStr(apiClass?.academic_year) || academicYearFromStudent;

  const rawTeacherFromApi = data?.class_teacher ?? body?.class_teacher;
  const classTeacherFromApi = rawTeacherFromApi && typeof rawTeacherFromApi === 'object' ? (rawTeacherFromApi as Record<string, unknown>) : null;
  const classTeacher = useSupabaseClass ? (supabaseStaffRow ?? null) : classTeacherFromApi;
  const teacherName = toStr(classTeacher?.full_name) || toStr(classTeacher?.name) || '';
  const teacherDesignation = toStr(classTeacher?.designation) || '';
  const teacherDept = toStr(classTeacher?.department) || '';
  const staffId = toStr(classTeacher?.staff_id) || toStr(classTeacher?.id) || '';
  const teacherEmail = toStr(classTeacher?.email) || '';
  const teacherPhone = toStr(classTeacher?.phone) || '';

  const { data: classesData } = useQuery({
    queryKey: ['classes', schoolCode],
    queryFn: async () => {
      const r = await schoolService.getClasses(schoolCode);
      const raw = r.data ?? r;
      const list = (raw as Record<string, unknown>)?.data ?? (raw as Record<string, unknown>)?.classes ?? raw;
      return Array.isArray(list) ? (list as { id: string; class?: string; section?: string }[]) : [];
    },
    enabled: Boolean(schoolCode) && !env.USE_SUPABASE_DASHBOARD,
  });
  const classesList = Array.isArray(classesData) ? classesData : [];

  const classId = useMemo(() => {
    if (classIdFromApi) return classIdFromApi;
    return (
      classesList.find((c) => String(c.class) === cls && String(c.section) === section)?.id ??
      classesList[0]?.id ??
      ''
    );
  }, [classIdFromApi, classesList, cls, section]);

  // Classmates: from API or Supabase (getStudents with class, section, academic_year)
  const {
    data: classmatesRes,
    refetch: refetchMates,
    isRefetching: refetchingMates,
  } = useQuery({
    queryKey: ['student', 'classmates', schoolCode, clsFromStudent, sectionFromStudent, academicYearFromStudent],
    queryFn: async () => {
      if (env.USE_SUPABASE_DASHBOARD) {
        const r = await schoolService.getStudents(schoolCode, {
          class: clsFromStudent,
          section: sectionFromStudent,
          academic_year: academicYearFromStudent || undefined,
        });
        const raw = (r as { data?: unknown })?.data ?? r;
        return Array.isArray(raw) ? raw : [];
      }
      const r = await studentService.getClassmates({
        school_code: schoolCode,
        class: clsFromStudent,
        section: sectionFromStudent,
        academic_year: academicYearFromStudent,
      });
      const raw = r.data ?? r;
      const list = (raw as Record<string, unknown>)?.data ?? (raw as Record<string, unknown>)?.classmates ?? raw;
      return Array.isArray(list) ? list : [];
    },
    enabled: Boolean(schoolCode && clsFromStudent && sectionFromStudent),
  });

  const { data: slotsRes, isLoading: loadingSlots, refetch: refetchSlots } = useQuery({
    queryKey: ['timetable', 'slots', schoolCode, classId],
    queryFn: async () => {
      const r = await timetableService.getTimetableSlots(schoolCode, { class_id: classId });
      const raw = r.data ?? r;
      const list = (raw as Record<string, unknown>)?.data ?? raw;
      return Array.isArray(list) ? list : [];
    },
    enabled: Boolean(schoolCode && classId),
  });

  const refetch = () => {
    if (needStudentFetch) refetchStudentProfile();
    if (env.USE_SUPABASE_DASHBOARD) {
      refetchSupabaseClass();
      refetchSupabaseStaff();
    } else {
      refetchCT();
    }
    refetchMates();
    refetchSlots();
  };

  const classmates = Array.isArray(classmatesRes) ? classmatesRes : [];
  const slots = Array.isArray(slotsRes) ? slotsRes : [];

  const filteredClassmates = useMemo(() => {
    if (!searchQuery.trim()) return classmates;
    const q = searchQuery.trim().toLowerCase();
    return (classmates as { student_name?: string; admission_no?: string; name?: string }[]).filter(
      (s) =>
        (s.student_name ?? s.name ?? '').toLowerCase().includes(q) ||
        (s.admission_no ?? '').toLowerCase().includes(q)
    );
  }, [classmates, searchQuery]);

  const hasSlots = slots.length > 0;
  const isLoading = env.USE_SUPABASE_DASHBOARD ? (loadingSupabaseClass || loadingSupabaseStaff) : loadingCT;

  const timetableMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, { day_of_week?: string; day?: string; period_order?: number; period?: number; subject_name?: string; subject?: unknown; start_time?: string; end_time?: string }>> = {};
    (slots as { day_of_week?: string; day?: string; period_order?: number; period?: number; subject_name?: string; subject?: unknown; start_time?: string; end_time?: string }[]).forEach((slot) => {
      const periodKey = `P${slot.period_order ?? slot.period ?? ''}`;
      const day = normalizeDay(slot.day_of_week ?? slot.day);
      if (!day) return;
      if (!matrix[periodKey]) matrix[periodKey] = {};
      matrix[periodKey][day] = slot;
    });
    return matrix;
  }, [slots]);

  const periodKeys = useMemo(() => {
    const keys = Object.keys(timetableMatrix);
    return keys.sort((a, b) => (parseInt(a.replace(/\D/g, ''), 10) || 0) - (parseInt(b.replace(/\D/g, ''), 10) || 0));
  }, [timetableMatrix]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>My Class</Text>
        <Pressable style={styles.menuBtn} hitSlop={12}>
          <Ionicons name="ellipsis-horizontal" size={22} color={TEXT} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              (env.USE_SUPABASE_DASHBOARD ? (refetchingSupabaseClass || refetchingSupabaseStaff) : refetchingCT) ||
              refetchingMates
            }
            onRefresh={refetch}
            tintColor={PRIMARY}
          />
        }
      >
        {/* Class Details (same as web: Class, Section, Academic Year) */}
        <View style={styles.heroCard}>
          <View style={styles.cardHeadingRow}>
            <Ionicons name="book-outline" size={20} color={TEXT} />
            <Text style={styles.cardHeading}>Class Details</Text>
          </View>
          {needStudentFetch && loadingStudentProfile ? (
            <View style={styles.detailLoading}>
              <ActivityIndicator size="small" color={PRIMARY} />
              <Text style={styles.detailLoadingText}>Loading class info…</Text>
            </View>
          ) : needStudentFetch && studentProfileError && !clsFromStudent && !sectionFromStudent ? (
            <View style={styles.detailError}>
              <Text style={styles.emptyText}>Could not load class info.</Text>
              <Pressable style={styles.retryBtn} onPress={() => refetchStudentProfile()}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Class</Text>
                <Text style={styles.detailValue}>{toStr(cls) || '—'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Section</Text>
                <Text style={styles.detailValue}>{toStr(section) || '—'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Academic Year</Text>
                <Text style={styles.detailValue}>{toStr(academicYear) || '—'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Class Teacher (same as web) */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="school-outline" size={20} color={TEXT} />
          <Text style={styles.sectionTitle}>Class Teacher</Text>
        </View>
        {isLoading ? (
          <View style={styles.card}>
            <ActivityIndicator size="small" color={PRIMARY} />
          </View>
        ) : teacherName ? (
          <View style={styles.card}>
            <View style={styles.teacherRow}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(teacherName as string).slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.onlineDot} />
              </View>
              <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{teacherName}</Text>
                <Text style={styles.teacherSubtitle}>
                  {[teacherDesignation, teacherDept].filter(Boolean).join(' • ') || 'Teacher'}
                </Text>
                {staffId ? (
                  <Text style={styles.teacherStaffId}>Staff ID: {staffId}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.teacherActions}>
              <Pressable
                style={styles.msgBtn}
                onPress={() => {}}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
                <Text style={styles.msgBtnText}>Message</Text>
              </Pressable>
              <Pressable
                style={styles.callBtn}
                onPress={() => teacherPhone && Linking.openURL(`tel:${teacherPhone}`)}
              >
                <Ionicons name="call-outline" size={22} color={PRIMARY} />
              </Pressable>
            </View>
            {(teacherEmail || teacherPhone) && (
              <View style={styles.contactRow}>
                {teacherEmail ? (
                  <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={18} color={MUTED} />
                    <Text style={styles.contactText}>{teacherEmail}</Text>
                  </View>
                ) : null}
                {teacherPhone ? (
                  <View style={styles.contactItem}>
                    <Ionicons name="call-outline" size={18} color={MUTED} />
                    <Text style={styles.contactText}>{teacherPhone}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No class teacher assigned.</Text>
          </View>
        )}

        {/* Class Timetable (same as web) */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="calendar-outline" size={20} color={TEXT} />
          <Text style={styles.sectionTitle}>Class Timetable</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Weekly schedule for {toStr(cls) || '—'}-{toStr(section) || '—'}</Text>
        {loadingSlots ? (
          <View style={styles.card}>
            <ActivityIndicator size="small" color={PRIMARY} />
          </View>
        ) : hasSlots ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.tableScrollContent}>
            <View style={styles.tableWrapper}>
              {/* Header Row */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.timeHeader]}>
                  <Text style={styles.headerText}>Time / Day</Text>
                </View>
                {DAYS.map((day) => (
                  <View key={day} style={[styles.cell, styles.dayHeader]}>
                    <Text style={styles.headerText}>{day.slice(0, 3)}</Text>
                  </View>
                ))}
              </View>
              {/* Period Rows */}
              {periodKeys.map((periodKey) => (
                <View key={periodKey} style={styles.tableRow}>
                  <View style={[styles.cell, styles.timeCell]}>
                    <Text style={styles.periodText}>{periodKey}</Text>
                  </View>
                  {DAYS.map((day) => {
                    const slot = timetableMatrix[periodKey]?.[day];
                    return (
                      <View key={day} style={styles.cell}>
                        {slot ? (
                          <View style={styles.subjectCard}>
                            <Text style={styles.subjectName} numberOfLines={2}>
                              {toStr(slot.subject) || toStr(slot.subject_name) || '—'}
                            </Text>
                            <Text style={styles.subjectTime} numberOfLines={1}>
                              {[slot.start_time, slot.end_time].filter(Boolean).join(' – ') || '—'}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.emptyDash}>-</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.warningCard}>
            <Ionicons name="information-circle-outline" size={32} color={MUTED} />
            <Text style={styles.warningTitle}>No Period Group Assigned</Text>
            <Text style={styles.warningDesc}>
              Please assign a period group to this class first.
            </Text>
            <Pressable style={styles.assignBtn} onPress={() => {}}>
              <Text style={styles.assignBtnText}>Assign Now</Text>
            </Pressable>
          </View>
        )}

        {/* Classmates (same as web) */}
        <View style={styles.classmatesHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="people-outline" size={20} color={TEXT} />
            <Text style={styles.sectionTitle}>Classmates ({classmates.length})</Text>
          </View>
          <Pressable onPress={() => {}}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or admission no…"
            placeholderTextColor={MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {filteredClassmates.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>
              {classmates.length === 0
                ? 'No students are mapped to your class yet.'
                : 'Try a different search.'}
            </Text>
          </View>
        ) : (
          <View style={styles.matesList}>
            {(filteredClassmates as { id?: string; student_name?: unknown; name?: unknown; admission_no?: unknown; photo_url?: string | null }[]).map((s, i) => {
              const nameStr = toStr(s.student_name) || toStr(s.name) || '—';
              const admStr = toStr(s.admission_no);
              return (
                <View key={s.id ?? i} style={styles.mateCard}>
                  <View style={styles.mateAvatar}>
                    {typeof s.photo_url === 'string' && s.photo_url ? (
                      <Image
                        source={{ uri: s.photo_url }}
                        style={styles.matePhoto}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.mateAvatarText}>
                        {nameStr.trim().slice(0, 1).toUpperCase() || '?'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.mateInfo}>
                    <Text style={styles.mateName} numberOfLines={1}>{nameStr}</Text>
                    <Text style={styles.mateAdm}>Adm: {admStr || 'N/A'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: S.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_START },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    paddingVertical: S.lg,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 56,
  },
  backBtn: { padding: S.sm, marginRight: S.sm },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: TEXT, textAlign: 'center' },
  menuBtn: { padding: S.sm },
  scroll: { flex: 1 },
  scrollContent: { padding: S.lg, paddingBottom: S.xxxl },

  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: S.xxl,
    marginBottom: S.xxl,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.lg },
  cardHeading: { fontSize: 18, fontWeight: '700', color: TEXT },
  detailsGrid: { gap: S.lg },
  detailItem: {},
  detailLabel: { fontSize: 12, color: MUTED, marginBottom: 4 },
  detailValue: { fontSize: 18, fontWeight: '700', color: TEXT },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  sectionSubtitle: { fontSize: 14, color: MUTED, marginBottom: S.lg },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: S.xl,
    marginBottom: S.xxl,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: { fontSize: 15, color: MUTED },
  detailLoading: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.lg },
  detailLoadingText: { fontSize: 14, color: MUTED },
  detailError: { paddingVertical: S.lg },
  retryBtn: {
    marginTop: S.md,
    paddingVertical: S.md,
    paddingHorizontal: S.xl,
    backgroundColor: PRIMARY,
    borderRadius: RADIUS_SM,
    alignSelf: 'flex-start',
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  teacherRow: { flexDirection: 'row', marginBottom: S.xl },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#16C784',
    borderWidth: 2,
    borderColor: CARD_BG,
  },
  teacherInfo: { flex: 1, marginLeft: S.lg, justifyContent: 'center' },
  teacherName: { fontSize: 18, fontWeight: '700', color: TEXT },
  teacherSubtitle: { fontSize: 14, color: MUTED, marginTop: 2 },
  teacherStaffId: { fontSize: 12, color: MUTED, marginTop: 4 },
  teacherActions: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.lg },
  msgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: S.md,
    borderRadius: 24,
  },
  msgBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactRow: { gap: S.sm },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  contactText: { fontSize: 14, color: MUTED },

  tableScrollContent: { paddingBottom: S.md, marginBottom: S.xxl },
  tableWrapper: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 560,
  },
  tableRow: {
    flexDirection: 'row',
  },
  cell: {
    width: 72,
    minWidth: 72,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 8,
    minHeight: 70,
    justifyContent: 'center',
  },
  timeHeader: {
    backgroundColor: '#F8FAFF',
    width: 88,
    minWidth: 88,
  },
  dayHeader: {
    backgroundColor: '#EAF1FF',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
  },
  timeCell: {
    backgroundColor: '#F8FAFF',
    width: 88,
    minWidth: 88,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
  },
  subjectCard: {
    backgroundColor: '#EAF1FF',
    padding: 6,
    borderRadius: 8,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
    textAlign: 'center',
  },
  subjectTime: {
    fontSize: 10,
    color: MUTED,
    textAlign: 'center',
    marginTop: 2,
  },
  emptyDash: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 14,
  },

  warningCard: {
    backgroundColor: '#FEF9E7',
    borderRadius: RADIUS_SM,
    padding: S.xl,
    marginBottom: S.xxl,
    borderWidth: 1,
    borderColor: '#F0E6C8',
    alignItems: 'center',
  },
  warningTitle: { fontSize: 16, fontWeight: '600', color: TEXT, marginTop: S.md },
  warningDesc: { fontSize: 14, color: MUTED, marginTop: S.sm, textAlign: 'center' },
  assignBtn: {
    marginTop: S.lg,
    paddingVertical: S.md,
    paddingHorizontal: S.xl,
    backgroundColor: PRIMARY,
    borderRadius: 24,
  },
  assignBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  classmatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.md,
  },
  viewAll: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 24,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: BORDER,
    gap: S.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
    paddingVertical: Platform.OS === 'web' ? 8 : 4,
  },
  matesList: { gap: S.sm },
  mateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS_SM,
    padding: S.lg,
    borderWidth: 1,
    borderColor: BORDER,
  },
  mateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.lg,
    overflow: 'hidden',
  },
  matePhoto: { width: 44, height: 44, borderRadius: 22 },
  mateAvatarText: { fontSize: 16, fontWeight: '700', color: PRIMARY },
  mateInfo: { flex: 1 },
  mateName: { fontSize: 16, fontWeight: '600', color: TEXT },
  mateAdm: { fontSize: 13, color: MUTED, marginTop: 2 },
});
