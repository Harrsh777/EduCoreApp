/**
 * Examinations: list (GET /api/examinations/v2/list).
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { examinationService } from '@/services/examination.service';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function ExaminationsScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['examinations', 'v2', schoolCode],
    queryFn: () => examinationService.getExaminationsList(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const raw = (data as { data?: unknown[] })?.data ?? (data as { list?: unknown[] })?.list ?? [];
  const list = Array.isArray(raw) ? raw : [];

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Examinations</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Exams" />
        {isLoading && list.length === 0 ? (
          <ActivityIndicator size="small" color={INDIGO} style={styles.loader} />
        ) : isError ? (
          <View>
            <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load'}</Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : list.length === 0 ? (
          <Text style={styles.empty}>No examinations.</Text>
        ) : (
          list.map((exam: { id?: string; name?: string }, i) => (
            <Pressable key={exam.id ?? i} style={styles.card}>
              <Text style={styles.cardTitle}>{exam.name ?? 'Exam'}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
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
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  loader: { marginVertical: spacing[4] },
  error: { ...textStyles.bodySm, color: '#B91C1C' },
  retryBtn: { marginTop: spacing[2] },
  retryText: { ...textStyles.button, color: INDIGO },
  empty: { ...textStyles.bodySm, color: '#6B7280' },
  card: { backgroundColor: '#fff', padding: spacing[4], borderRadius: 12, marginBottom: spacing[3], borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { ...textStyles.body, color: '#111827', fontWeight: '600' },
});
