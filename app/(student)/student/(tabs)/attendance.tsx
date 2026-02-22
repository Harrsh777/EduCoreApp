import { AppCard, DataList, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { studentService } from '@/services/student.service';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

type AttRow = { date?: string; status?: string };

export default function StudentAttendanceScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id } = useSession();
  const student_id = user_id ?? '';

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'attendance', school_code, student_id],
    queryFn: async () => {
      const res = await studentService.getAttendance({ school_code: school_code!, student_id });
      return res.data;
    },
    enabled: Boolean(school_code && student_id),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="My attendance" />
      <DataList<AttRow>
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No records"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item, i) => item.date ?? String(i)}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <View style={styles.row}>
              <Text style={[styles.date, { color: c.text.primary }]}>{item.date ?? '—'}</Text>
              <Text style={[styles.status, { color: item.status === 'present' ? c.success.main : c.error.main }]}>{item.status ?? '—'}</Text>
            </View>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 16 },
  status: { fontWeight: '600' },
});
