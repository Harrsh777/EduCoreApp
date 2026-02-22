import { AppCard, DataList, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { diaryService } from '@/services/diary.service';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

type DiaryEntry = { id: string; title?: string; body?: string; created_at?: string };

export default function TeacherHomeworkScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSession();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['teacher', 'diary', school_code],
    queryFn: async () => {
      const res = await diaryService.getDiary(school_code!);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Homework / Diary" />
      <DataList<DiaryEntry>
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No entries"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{item.title ?? '—'}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={2}>{item.body ?? ''}</Text>
            <Text style={[styles.meta, { color: c.text.tertiary }]}>{item.created_at ?? ''}</Text>
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
  meta: { fontSize: 12, marginTop: 4 },
});
