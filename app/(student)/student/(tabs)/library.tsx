import { AppCard, DataList, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { libraryService } from '@/services/library.service';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

export default function StudentLibraryScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSession();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'library', school_code],
    queryFn: async () => {
      const res = await libraryService.getBooks(school_code!);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Library" />
      <DataList
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No books"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item: Record<string, unknown>) => String(item.id)}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }: { item: Record<string, unknown> }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{String(item.title ?? '—')}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>{String(item.author ?? '')}</Text>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
});
