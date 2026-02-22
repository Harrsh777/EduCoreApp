/**
 * Student Examinations: list of exams, subject-wise dates, download date sheet.
 * API: GET /api/examinations/v2/student?school_code=&student_id=
 */

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useStudent } from '@/lib/student-context';
import { examinationService } from '@/services/examination.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const STUDENT_BLUE = '#2563EB';

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

export default function StudentExaminationsScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['examinations', 'student', schoolCode, studentId],
    queryFn: () => examinationService.getExaminationsStudent(schoolCode, studentId).then((r) => r.data),
    enabled: Boolean(schoolCode && studentId),
  });

  const exams = useMemo(() => {
    const raw = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
    return raw as Array<{ id?: string; name?: string; exam_date?: string; schedules?: Array<{ subject?: string; date?: string }>; date_sheet_url?: string }>;
  }, [data]);

  const handleDownloadDateSheet = (exam: { id?: string; name?: string; date_sheet_url?: string }) => {
    const url = exam.date_sheet_url;
    if (url) {
      Linking.openURL(url).catch(() =>
        Alert.alert('Open', 'Could not open date sheet link.')
      );
    } else {
      Alert.alert('Download', 'No date sheet URL available for this exam.');
    }
  };

  if (isLoading && exams.length === 0) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: STUDENT_BLUE }]}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Examinations</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={STUDENT_BLUE} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: STUDENT_BLUE }]}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Examinations</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          <Pressable onPress={() => refetch()}>
            <Text style={[styles.retry, { color: STUDENT_BLUE }]}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: STUDENT_BLUE }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Examinations</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={STUDENT_BLUE} />
        }
      >
        {exams.length === 0 ? (
          <Text style={styles.hint}>No examinations.</Text>
        ) : (
          exams.map((exam) => (
            <View key={exam.id} style={styles.card}>
              <Text style={styles.cardTitle}>{exam.name ?? 'Exam'}</Text>
              {exam.exam_date ? <Text style={styles.cardMeta}>{formatDate(exam.exam_date)}</Text> : null}
              {(exam.schedules ?? []).length > 0 && (
                <View style={styles.schedules}>
                  {(exam.schedules ?? []).map((s, i) => (
                    <View key={i} style={styles.scheduleRow}>
                      <Text style={styles.scheduleSubject}>{s.subject ?? '—'}</Text>
                      <Text style={styles.scheduleDate}>{s.date ? formatDate(s.date) : '—'}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Pressable
                style={[styles.downloadBtn, { backgroundColor: STUDENT_BLUE }]}
                onPress={() => handleDownloadDateSheet(exam)}
              >
                <Text style={styles.downloadBtnText}>Download date sheet</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F9FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 56,
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[4] },
  error: { ...textStyles.body, color: '#B91C1C', marginBottom: spacing[2] },
  retry: { fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    padding: spacing[4],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing[4],
  },
  cardTitle: { ...textStyles.h4, color: '#111827' },
  cardMeta: { ...textStyles.bodySm, color: '#6B7280', marginTop: spacing[1] },
  schedules: { marginTop: spacing[3] },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing[1] },
  scheduleSubject: { ...textStyles.body, color: '#374151' },
  scheduleDate: { ...textStyles.bodySm, color: '#6B7280' },
  downloadBtn: { marginTop: spacing[3], padding: spacing[3], borderRadius: 8, alignItems: 'center' },
  downloadBtnText: { color: '#fff', fontWeight: '600' },
  hint: { ...textStyles.bodySm, color: '#6B7280' },
});
