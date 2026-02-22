import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { DataList, AppCard, SectionHeader } from '@/components/ui';
import { schoolService } from '@/services/school.service';

type Notice = { id: string; title?: string; body?: string; category?: string; priority?: string; [key: string]: unknown };

export default function SchoolCommunicationScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'communication', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await schoolService.getNotices(school_code, { limit: 50 });
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Communication" />
      <DataList<Notice>
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No notices"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{item.title ?? '—'}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={2}>{item.body ?? ''}</Text>
            {(item.category ?? item.priority) ? (
              <Text style={[styles.meta, { color: c.text.tertiary }]}>{item.category ?? ''} {item.priority ?? ''}</Text>
            ) : null}
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
  meta: { fontSize: 12, marginTop: 4 },
});
