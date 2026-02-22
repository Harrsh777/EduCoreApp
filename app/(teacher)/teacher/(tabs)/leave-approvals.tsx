import { AppCard, Button, DataList, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { useToastStore } from '@/lib/toast';
import { leaveService } from '@/services/leave.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

type Request = { id: string; student_name?: string; start_date?: string; end_date?: string; reason?: string };

export default function TeacherLeaveApprovalsScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id } = useSession();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['teacher', 'student-leave-requests', school_code, user_id],
    queryFn: async () => {
      const res = await leaveService.getStudentLeaveRequestsClassTeacher(school_code!, user_id!);
      return res.data;
    },
    enabled: Boolean(school_code && user_id),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      leaveService.patchStudentLeaveApproval(school_code!, id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'student-leave-requests'] });
      showToast('Updated', 'success');
    },
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Leave approvals" />
      <DataList<Request>
        data={list}
        loading={isLoading}
        emptyTitle="No pending requests"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]}>{item.student_name ?? item.id}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]}>{item.start_date ?? ''} – {item.end_date ?? ''}</Text>
            <Text style={[styles.reason, { color: c.text.tertiary }]} numberOfLines={2}>{item.reason ?? ''}</Text>
            <View style={[styles.actions, { flexDirection: 'row', gap: 8, marginTop: 12 }]}>
              <Button title="Approve" onPress={() => approveMutation.mutate({ id: item.id, status: 'approved' })} />
              <Button title="Reject" variant="outline" onPress={() => approveMutation.mutate({ id: item.id, status: 'rejected' })} />
            </View>
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
  reason: { fontSize: 14, marginTop: 4 },
  actions: {},
});
