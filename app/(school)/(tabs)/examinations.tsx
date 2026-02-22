import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { DataList, AppCard, SectionHeader, FloatingActionButton } from '@/components/ui';
import { examinationService } from '@/services/examination.service';

type Exam = { id: string; name?: string; academic_year?: string; status?: string; [key: string]: unknown };

export default function SchoolExaminationsScreen() {
  const router = useRouter();
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'examinations', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await examinationService.getExaminationsList(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Examinations" />
      <DataList<Exam>
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No examinations"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard
            style={{ marginBottom: spacing[3] }}
            onPress={() => router.push(`/school/examinations/${item.id}` as never)}
          >
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{item.name ?? item.id}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>{item.academic_year ?? ''} · {item.status ?? ''}</Text>
          </AppCard>
        )}
      />
      <FloatingActionButton onPress={() => router.push('/school/examinations/new' as never)} label="+" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
});
