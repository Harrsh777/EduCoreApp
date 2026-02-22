import { AppCard, SectionHeader, StatCard } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { schoolService } from '@/services/school.service';
import { studentService } from '@/services/student.service';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StudentDashboardScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id, profile } = useSession();
  const student_id = user_id ?? (profile as { id?: string })?.id ?? '';

  const { data: statsData, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'stats', school_code, student_id],
    queryFn: async () => {
      const res = await studentService.getStats({ school_code: school_code!, student_id });
      return res.data;
    },
    enabled: Boolean(school_code && student_id),
  });

  const { data: noticesData } = useQuery({
    queryKey: ['student', 'notices', school_code],
    queryFn: async () => {
      const res = await schoolService.getNotices(school_code!, { limit: 5 });
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const stats = (statsData ?? {}) as Record<string, number>;
  const notices = Array.isArray(noticesData) ? noticesData : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={c.primary[600]} />
      }
    >
      <SectionHeader title={`Hello, ${profile?.name ?? 'Student'}`} />
      <View style={[styles.cards, { gap: spacing[3], marginBottom: spacing[4] }]}>
        <StatCard label="Attendance %" value={stats.attendance_percent ?? '—'} variant="primary" />
        <StatCard label="Marks" value={stats.marks ?? '—'} variant="success" />
      </View>
      <SectionHeader title="Notice feed" />
      {notices.slice(0, 5).map((n: { id: string; title?: string; body?: string }) => (
        <AppCard key={n.id} style={{ marginBottom: spacing[3] }}>
          <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{n.title ?? '—'}</Text>
          <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={2}>{n.body ?? ''}</Text>
        </AppCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cards: { flexDirection: 'row', flexWrap: 'wrap' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
});
