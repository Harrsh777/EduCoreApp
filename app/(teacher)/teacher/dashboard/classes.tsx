/**
 * Classes: list of classes assigned to teacher. GET /api/classes/teacher.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { teacherService } from '@/services/teacher.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

export default function TeacherClassesScreen() {
  const router = useRouter();
  const { schoolCode, teacher, path } = useTeacher();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacher?.id],
    queryFn: () => teacherService.getClasses({ school_code: schoolCode, teacher_id: teacher?.id ?? '' }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });

  const list = (Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? []) as Array<{ id: string; name?: string; [k: string]: unknown }>;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Classes</Text>
      </View>
      {isLoading && !list.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEACHER_GREEN} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          <Pressable onPress={() => refetch()}><Text style={[styles.retry, { color: TEACHER_GREEN }]}>Retry</Text></Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {list.map((c) => (
            <Pressable
              key={c.id}
              style={styles.card}
              onPress={() => router.push(path('my-class') as never)}
            >
              <Text style={styles.cardTitle}>{c.name ?? c.id}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
          {list.length === 0 && <Text style={styles.empty}>No classes assigned.</Text>}
        </ScrollView>
      )}
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: spacing[4], borderRadius: 12, marginBottom: spacing[2], borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { ...textStyles.body, fontWeight: '600', color: '#111827', flex: 1 },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  empty: { ...textStyles.body, color: '#6B7280' },
});
