import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import {
  DataList,
  AppCard,
  SectionHeader,
  SearchBar,
  FloatingActionButton,
} from '@/components/ui';
import { schoolService } from '@/services/school.service';

type Student = { id: string; name?: string; admission_no?: string; class?: string; section?: string; [key: string]: unknown };

export default function SchoolStudentsScreen() {
  const router = useRouter();
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'students', school_code, search],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await schoolService.getStudents(school_code, search.trim() ? { search: search.trim() } : undefined);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Students" />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search students..." />
      <DataList<Student>
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No students"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard
            style={{ marginBottom: spacing[3] }}
            onPress={() => router.push(`/school/students/${item.id}` as never)}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardMain}>
                <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{item.name ?? item.admission_no ?? item.id}</Text>
                <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>{item.admission_no ?? ''} · {item.class ?? ''}{item.section ? `-${item.section}` : ''}</Text>
              </View>
            </View>
          </AppCard>
        )}
      />
      <FloatingActionButton onPress={() => router.push('/school/students/new' as never)} label="+" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardMain: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
});
