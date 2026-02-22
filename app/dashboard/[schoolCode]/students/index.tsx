/**
 * Student Management: list (FlatList), search/filter, add, import, attendance.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';
import { DataList, SearchBar } from '@/components/ui';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

type StudentRow = { id: string; admission_no?: string; name?: string; class?: string; section?: string; [k: string]: unknown };

export default function StudentsListScreen() {
  const router = useRouter();
  const { schoolCode, path } = useSchoolCode();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['students', schoolCode, classFilter],
    queryFn: () => schoolService.getStudents(schoolCode, classFilter ? { class: classFilter } : undefined).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const rawList = Array.isArray(data) ? data : (data as { data?: StudentRow[] })?.data ?? [];
  const list = (rawList ?? []) as StudentRow[];
  const filtered = search.trim()
    ? list.filter(
        (s) =>
          String(s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          String(s.admission_no ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : list;

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Students</Text>
        <Pressable style={styles.headerBtn} onPress={() => router.push(path('students/add') as never)}>
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>
      <View style={styles.toolbar}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search students…" />
        <View style={styles.links}>
          <Pressable style={styles.link} onPress={() => router.push(path('students/import') as never)}>
            <Text style={styles.linkText}>Bulk import</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={() => router.push(path('students/attendance') as never)}>
            <Text style={styles.linkText}>Mark attendance</Text>
          </Pressable>
        </View>
      </View>
      {isLoading && !list.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={INDIGO} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load students'}</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <DataList
          data={filtered}
          keyExtractor={(item) => item.id ?? String(item.admission_no ?? Math.random())}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => router.push(path(`students/${item.id}`) as never)}>
              <View style={styles.rowMain}>
                <Text style={styles.rowName}>{item.name ?? item.admission_no ?? '—'}</Text>
                <Text style={styles.rowMeta}>{item.admission_no ?? ''} · {item.class ?? ''} {item.section ?? ''}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
          loading={isLoading}
          error={isError ? (error as Error)?.message : null}
          emptyTitle="No students"
          emptyMessage={search.trim() ? 'Try a different search.' : 'Add students to get started.'}
          onRefresh={handleRefresh}
          refreshing={isRefetching}
        />
      )}
      <FloatingActionButton
        onPress={() => router.push(path('students/add') as never)}
        icon={<Ionicons name="add" size={24} color="#fff" />}
      />
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
  headerBtn: { padding: spacing[2] },
  addText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  toolbar: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  links: { flexDirection: 'row', gap: spacing[4], marginTop: spacing[2] },
  link: { paddingVertical: spacing[1] },
  linkText: { fontSize: 14, color: INDIGO, fontWeight: '500' },
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
  rowMain: { flex: 1 },
  rowName: { ...textStyles.body, color: '#111827', fontWeight: '600' },
  rowMeta: { ...textStyles.caption, color: '#6B7280', marginTop: 2 },
  chevron: { fontSize: 20, color: '#9CA3AF', marginLeft: spacing[2] },
});
