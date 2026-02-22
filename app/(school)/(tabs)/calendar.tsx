import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { DataList, AppCard, SectionHeader } from '@/components/ui';
import { schoolService } from '@/services/school.service';

type CalendarEntry = { id?: string; date?: string; label?: string; type?: string; [key: string]: unknown };

export default function SchoolCalendarScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'calendar', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await schoolService.getCalendarAcademic(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Academic Calendar" />
      <DataList<CalendarEntry>
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No calendar entries"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item, i) => item.id ?? String(i)}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{item.label ?? item.date ?? '—'}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>{item.date ?? ''} · {item.type ?? ''}</Text>
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
