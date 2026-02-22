import { AppCard, SectionHeader, StatCard } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { teacherService } from '@/services/teacher.service';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TeacherDashboardScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id, profile } = useSession();
  const teacher_id = user_id ?? (profile as { id?: string })?.id ?? '';

  const { data: classesData, refetch, isRefetching } = useQuery({
    queryKey: ['teacher', 'classes', school_code, teacher_id],
    queryFn: async () => {
      const res = await teacherService.getClasses({ school_code: school_code!, teacher_id });
      return res.data;
    },
    enabled: Boolean(school_code && teacher_id),
  });

  const { data: todosData } = useQuery({
    queryKey: ['teacher', 'todos', school_code, teacher_id],
    queryFn: async () => {
      const res = await teacherService.getTodos({ school_code: school_code!, teacher_id, status: 'pending,in_progress' });
      return res.data;
    },
    enabled: Boolean(school_code && teacher_id),
  });

  const classes = Array.isArray(classesData) ? classesData : [];
  const todos = Array.isArray(todosData) ? todosData : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={c.primary[600]} />
      }
    >
      <SectionHeader title={`Hello, ${profile?.name ?? 'Teacher'}`} />
      <View style={[styles.cards, { gap: spacing[3], marginBottom: spacing[4] }]}>
        <StatCard label="My classes" value={classes.length} variant="primary" />
        <StatCard label="Pending todos" value={todos.length} variant="warning" />
      </View>
      <SectionHeader title="Quick actions" />
      <AppCard style={{ marginBottom: spacing[3] }}>
        <Text style={[styles.hint, { color: c.text.secondary }]}>Mark attendance, enter marks, and manage todos from the tabs below.</Text>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cards: { flexDirection: 'row', flexWrap: 'wrap' },
  hint: { fontSize: 14 },
});
