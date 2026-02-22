import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { DataList, AppCard, SectionHeader, SearchBar } from '@/components/ui';
import { schoolService } from '@/services/school.service';

type StaffMember = { id: string; name?: string; staff_id?: string; email?: string; [key: string]: unknown };

export default function SchoolStaffScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'staff', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await schoolService.getStaff(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const list = Array.isArray(data) ? data : [];
  const filtered = search.trim()
    ? list.filter(
        (s: StaffMember) =>
          (s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (s.staff_id ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : list;

  return (
    <View style={styles.container}>
      <SectionHeader title="Staff" />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search staff..." />
      <DataList<StaffMember>
        data={filtered}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No staff"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{item.name ?? item.staff_id ?? item.id}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>{item.staff_id ?? ''} · {item.email ?? ''}</Text>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
});
