/**
 * Staff Directory: search, staff cards (name, role, email, phone). GET /api/staff.
 */

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { schoolService } from '@/services/school.service';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

export default function TeacherStaffDirectoryScreen() {
  const { schoolCode } = useTeacher();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['staff', schoolCode],
    queryFn: () => schoolService.getStaff(schoolCode).then((r) => (r as { data?: unknown[] })?.data ?? []),
    enabled: Boolean(schoolCode),
  });
  const list = (Array.isArray(data) ? data : []) as { id?: string; name?: string; staff_id?: string; role?: string; designation?: string; email?: string; phone?: string }[];
  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (s) =>
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.role ?? '').toLowerCase().includes(q) ||
        (s.designation ?? '').toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.phone ?? '').toLowerCase().includes(q)
    );
  }, [list, search]);

  return (
    <View style={styles.root}>
      <AppHeader title="Staff Directory" />
      <View style={styles.searchWrap}>
        <TextInput style={styles.searchInput} placeholder="Search name, role, email, phone..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
      </View>
      <ScreenWrapper scroll={false} loading={isLoading && !list.length}>
        {isError ? <View style={styles.centered}><Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed'}</Text></View> : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id ?? item.staff_id ?? String(Math.random())}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>{item.name ?? item.staff_id ?? '—'}</Text>
                <Text style={styles.cardRole}>{item.role ?? item.designation ?? '—'}</Text>
                {item.email ? <Text style={styles.cardMeta}>Email: {item.email}</Text> : null}
                {item.phone ? <Text style={styles.cardMeta}>Phone: {item.phone}</Text> : null}
              </Card>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No staff found.</Text>}
          />
        )}
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: s.lg, paddingVertical: s.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: s.md, paddingVertical: s.sm, fontSize: 14, color: colors.textPrimary },
  listContent: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { marginBottom: s.lg },
  cardTitle: { ...textStyles.body, fontWeight: '600', color: colors.textPrimary },
  cardRole: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 2 },
  cardMeta: { ...textStyles.caption, color: colors.textMuted, marginTop: 2 },
  centered: { flex: 1, padding: s.lg },
  errorText: { ...textStyles.body, color: colors.danger },
  empty: { ...textStyles.body, color: colors.textMuted, textAlign: 'center', marginTop: s.xl },
});
