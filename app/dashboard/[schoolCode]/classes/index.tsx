/**
 * Classes list: GET /api/classes; tap class -> detail + subject-teacher.
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';
import { DataList } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

type ClassRow = { id: string; name?: string; section?: string; class_name?: string; [k: string]: unknown };

export default function ClassesListScreen() {
  const router = useRouter();
  const { schoolCode, path } = useSchoolCode();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['classes', schoolCode],
    queryFn: () => schoolService.getClasses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const rawList = Array.isArray(data) ? data : (data as { data?: ClassRow[] })?.data ?? [];
  const list = (rawList ?? []) as ClassRow[];

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Classes</Text>
      </View>
      {isLoading && !list.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={INDIGO} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load classes'}</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <DataList
          data={list}
          keyExtractor={(item) => item.id ?? String(item.name ?? Math.random())}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => router.push(path(`classes/${item.id}`) as never)}>
              <Text style={styles.rowName}>{item.name ?? item.class_name ?? item.id ?? '—'}</Text>
              {item.section ? <Text style={styles.rowMeta}>{item.section}</Text> : null}
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
          loading={isLoading}
          error={isError ? (error as Error)?.message : null}
          emptyTitle="No classes"
          emptyMessage="Add classes in the web app or via API."
          onRefresh={handleRefresh}
          refreshing={isRefetching}
        />
      )}
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
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2] },
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[6] },
  errorText: { ...textStyles.bodySm, color: '#B91C1C', marginBottom: spacing[4] },
  retryBtn: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  retryText: { ...textStyles.button, color: INDIGO },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowName: { ...textStyles.body, color: '#111827', fontWeight: '600', flex: 1 },
  rowMeta: { ...textStyles.caption, color: '#6B7280', marginRight: spacing[2] },
  chevron: { fontSize: 20, color: '#9CA3AF' },
});
