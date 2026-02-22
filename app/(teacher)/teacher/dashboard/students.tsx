/**
 * Student Management: searchable list. GET /api/students.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { schoolService } from '@/services/school.service';
import { SearchBar } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

type StudentRow = { id: string; name?: string; admission_no?: string; class?: string; section?: string };

export default function TeacherStudentsScreen() {
  const router = useRouter();
  const { schoolCode } = useTeacher();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['students', schoolCode],
    queryFn: () => schoolService.getStudents(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const rawList = (Array.isArray(data) ? data : (data as { data?: StudentRow[] })?.data ?? []) as StudentRow[];
  const list = search.trim()
    ? rawList.filter((s) => String(s.name ?? '').toLowerCase().includes(search.toLowerCase()) || String(s.admission_no ?? '').toLowerCase().includes(search.toLowerCase()))
    : rawList;

  const renderItem = useCallback(({ item }: { item: StudentRow }) => (
    <Pressable style={styles.row}>
      <Text style={styles.rowName} numberOfLines={1}>{item.name ?? item.admission_no ?? item.id}</Text>
      <Text style={styles.rowMeta}>{item.class ?? ''} {item.section ?? ''}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  ), []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Students</Text>
      </View>
      <View style={styles.toolbar}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search students…" />
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
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No students.</Text>}
        />
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
  toolbar: { padding: spacing[4], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...textStyles.body, color: '#B91C1C', marginBottom: spacing[2] },
  retry: { ...textStyles.button },
  listContent: { padding: spacing[4], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], backgroundColor: '#fff', borderRadius: 12, marginBottom: spacing[2], borderWidth: 1, borderColor: '#E5E7EB' },
  rowName: { ...textStyles.body, fontWeight: '600', color: '#111827', flex: 1 },
  rowMeta: { ...textStyles.caption, color: '#6B7280', marginRight: spacing[2] },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  empty: { ...textStyles.body, color: '#6B7280' },
});
