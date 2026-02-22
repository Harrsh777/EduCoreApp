import { AppCard, Button, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { useToastStore } from '@/lib/toast';
import { leaveService } from '@/services/leave.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function StudentApplyLeaveScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id } = useSession();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const { data: typesData } = useQuery({
    queryKey: ['leave-types', school_code],
    queryFn: async () => {
      const res = await leaveService.getLeaveTypes(school_code!);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      leaveService.postStudentLeaveRequest(school_code!, {
        student_id: user_id,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'leave'] });
      showToast('Leave applied', 'success');
      setStartDate('');
      setEndDate('');
      setReason('');
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed', 'error'),
  });

  const types = Array.isArray(typesData) ? typesData : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing[4] }}>
      <SectionHeader title="Apply leave" />
      <AppCard style={{ marginBottom: spacing[4] }}>
        <Text style={[styles.label, { color: c.text.secondary }]}>Leave type</Text>
        <View style={[styles.chips, { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }]}>
          {types.map((t: { id: string; name?: string }) => (
            <Button
              key={t.id}
              title={String(t.name ?? t.id)}
              variant={leaveTypeId === t.id ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setLeaveTypeId(t.id)}
            />
          ))}
        </View>
        <Text style={[styles.label, { color: c.text.secondary }]}>Start date</Text>
        <TextInput
          style={[styles.input, { borderColor: c.border.default, color: c.text.primary }]}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={c.text.tertiary}
        />
        <Text style={[styles.label, { color: c.text.secondary }]}>End date</Text>
        <TextInput
          style={[styles.input, { borderColor: c.border.default, color: c.text.primary }]}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={c.text.tertiary}
        />
        <Text style={[styles.label, { color: c.text.secondary }]}>Reason</Text>
        <TextInput
          style={[styles.input, { borderColor: c.border.default, color: c.text.primary }]}
          value={reason}
          onChangeText={setReason}
          placeholder="Reason"
          placeholderTextColor={c.text.tertiary}
        />
        <Button title="Submit" onPress={() => applyMutation.mutate()} loading={applyMutation.isPending} style={{ marginTop: spacing[4] }} />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 14, marginBottom: 4 },
  chips: {},
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12, fontSize: 16 },
});
