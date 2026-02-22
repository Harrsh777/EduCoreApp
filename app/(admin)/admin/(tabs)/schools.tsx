import { View, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import {
  DataList,
  AppCard,
  SectionHeader,
  SearchBar,
  FilterChips,
  StatusBadge,
  type ChipOption,
} from '@/components/ui';
import { adminService, type School } from '@/services/admin.service';
import { useState } from 'react';
import { Text, Pressable } from 'react-native';

const STATUS_OPTIONS: ChipOption[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
];

export default function AdminSchoolsScreen() {
  const { spacing, colors: c } = useTheme();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'schools', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: async () => {
      const res = await adminService.getSchools(
        statusFilter && statusFilter !== 'all' ? { status: statusFilter } : undefined
      );
      return res.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateSchoolStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'schools'] });
    },
  });

  const list = Array.isArray(data) ? data : [];
  const filtered = search.trim()
    ? list.filter(
        (s) =>
          (s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (s.school_code ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : list;

  return (
    <View style={styles.container}>
      <SectionHeader title="Schools" />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search schools..." />
      <FilterChips options={STATUS_OPTIONS} selectedId={statusFilter} onSelect={(id) => setStatusFilter(id)} />
      <DataList<School>
        data={filtered}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No schools"
        emptyMessage="No schools match your filters."
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard
            onPress={undefined}
            style={{ marginBottom: spacing[3] }}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardMain}>
                <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>
                  {item.name ?? item.school_code ?? item.id}
                </Text>
                <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>
                  {item.school_code ?? '—'}
                </Text>
              </View>
              <StatusBadge
                label={(item.status ?? 'unknown') as string}
                variant={
                  item.status === 'accepted'
                    ? 'approved'
                    : item.status === 'rejected'
                      ? 'rejected'
                      : 'pending'
                }
              />
            </View>
            {item.status === 'pending' && (
              <View style={[styles.actions, { marginTop: spacing[2], gap: spacing[2] }]}>
                <Pressable
                  onPress={() => updateStatus.mutate({ id: item.id, status: 'accepted' })}
                  disabled={updateStatus.isPending}
                >
                  <Text style={[styles.actionBtn, { color: c.success.main }]}>Accept</Text>
                </Pressable>
                <Pressable
                  onPress={() => updateStatus.mutate({ id: item.id, status: 'rejected' })}
                  disabled={updateStatus.isPending}
                >
                  <Text style={[styles.actionBtn, { color: c.error.main }]}>Reject</Text>
                </Pressable>
              </View>
            )}
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardMain: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
  actions: { flexDirection: 'row' },
  actionBtn: { fontSize: 14, fontWeight: '600' },
});
