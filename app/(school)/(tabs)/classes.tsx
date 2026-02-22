import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { DataList, AppCard, SectionHeader } from '@/components/ui';
import { schoolService } from '@/services/school.service';

type ClassItem = { id: string; class?: string; section?: string; academic_year?: string; [key: string]: unknown };

export default function SchoolClassesScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'classes', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await schoolService.getClasses(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Classes" />
      <DataList<ClassItem>
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No classes"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>
              {item.class ?? ''}{item.section ? `-${item.section}` : ''} {item.academic_year ?? ''}
            </Text>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
});
