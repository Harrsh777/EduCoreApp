/**
 * Examinations: list from GET /api/examinations/v2/teacher, grouped by date.
 */

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { teacherService } from '@/services/teacher.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

function examStatus(exam: Record<string, unknown>) {
  const raw = String(exam.status ?? '').toLowerCase();
  if (raw.includes('lock') || raw.includes('final')) return { label: 'Finalized', bg: '#FEE2E2', text: '#B91C1C' };
  if (raw.includes('active') || raw.includes('open')) return { label: 'Open', bg: '#DCFCE7', text: '#166534' };
  return { label: 'Scheduled', bg: '#E0F2FE', text: '#075985' };
}

function dateWindow(exam: Record<string, unknown>) {
  const start = String(exam.start_date ?? exam.exam_date ?? '').trim();
  const end = String(exam.end_date ?? '').trim();
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
  if (start) return formatDate(start);
  return 'Date TBD';
}

export default function TeacherExaminationsScreen() {
  const router = useRouter();
  const { schoolCode, teacher, path } = useTeacher();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['teacher', 'exams', schoolCode, teacher?.id, teacher?.staff_id],
    queryFn: () =>
      teacherService
        .getExams({
          school_code: schoolCode,
          teacher_id: teacher?.id ?? '',
          staff_id: teacher?.staff_id,
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });

  const exams = (Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? []) as Array<{ id?: string; name?: string; exam_name?: string; exam_date?: string; subjects?: unknown[]; class_name?: string; [k: string]: unknown }>;
  const byDate = useMemo(() => {
    const map: Record<string, typeof exams> = {};
    exams.forEach((e) => {
      const key = e.exam_date ?? 'No date';
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [exams]);

  if (isLoading && !exams.length) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Examinations</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEACHER_GREEN} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Examinations</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          <Pressable onPress={() => refetch()}>
            <Text style={[styles.retry, { color: TEACHER_GREEN }]}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Examinations</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {byDate.map(([dateKey, list]) => (
          <View key={dateKey} style={styles.section}>
            <Text style={styles.sectionTitle}>{formatDate(dateKey)}</Text>
            {list.map((exam) => (
              <Pressable
                key={exam.id}
                style={styles.card}
                onPress={() => router.push(path('marks') as never)}
              >
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{exam.name ?? exam.exam_name ?? 'Exam'}</Text>
                  <Text style={styles.cardMeta}>{dateWindow(exam)}</Text>
                  <Text style={styles.cardCoverage}>
                    {(String(exam.class_name ?? exam.class ?? '').trim() || 'Assigned classes')} · {(Array.isArray(exam.subjects) ? exam.subjects.length : 0) || String(exam.subject_name ?? '').trim() ? 'Subjects mapped' : 'Subject mapping pending'}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: examStatus(exam).bg }]}>
                  <Text style={[styles.statusPillText, { color: examStatus(exam).text }]}>{examStatus(exam).label}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        ))}
        {exams.length === 0 && (
          <Text style={styles.empty}>No examinations.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', minHeight: 56 },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...textStyles.body, color: '#B91C1C', marginBottom: spacing[2] },
  retry: { ...textStyles.button },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  section: { marginBottom: spacing[6] },
  sectionTitle: { ...textStyles.h4, color: '#6B7280', marginBottom: spacing[2] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: spacing[4], borderRadius: 12, marginBottom: spacing[2], borderWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  cardMain: { flex: 1 },
  cardTitle: { ...textStyles.body, fontWeight: '700', color: '#111827' },
  cardMeta: { ...textStyles.caption, color: '#6B7280', marginTop: 2 },
  cardCoverage: { ...textStyles.caption, color: '#94A3B8', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusPillText: { ...textStyles.caption, fontWeight: '700' },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  empty: { ...textStyles.body, color: '#6B7280' },
});
