/**
 * Apply for Leave: type, date range, auto day count, reason (required), comment (optional).
 * GET /api/leave/types, POST /api/leave/requests.
 */

import { useRouter } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { leaveService } from '@/services/leave.service';
import { useToastStore } from '@/lib/toast';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, PrimaryButton, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s, cardRadius } = teacherDashboardTheme;

function dayCount(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(start);
  const b = new Date(end);
  if (a.getTime() > b.getTime()) return 0;
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

export default function TeacherApplyLeaveScreen() {
  const router = useRouter();
  const { schoolCode, teacher } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');

  const { data: typesData, isLoading: typesLoading, error: typesError } = useQuery({
    queryKey: ['leave', 'types', schoolCode],
    queryFn: () => leaveService.getLeaveTypes(schoolCode).then((r) => (r as { data?: unknown })?.data),
    enabled: Boolean(schoolCode),
  });
  const types = (Array.isArray(typesData) ? typesData : (typesData as unknown[] ?? [])) as Array<{ id: string; name?: string }>;

  const days = useMemo(() => dayCount(startDate, endDate), [startDate, endDate]);

  const submitMutation = useMutation({
    mutationFn: () =>
      leaveService.postStaffLeaveRequest(schoolCode, {
        staff_id: teacher?.staff_id ?? teacher?.id,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests', schoolCode] });
      showToast('Leave request submitted', 'success');
      router.back();
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Submit failed', 'error');
    },
  });

  const handleSubmit = useCallback(() => {
    if (!leaveTypeId) {
      showToast('Select leave type', 'error');
      return;
    }
    if (!startDate || !endDate) {
      showToast('Select start and end date', 'error');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showToast('End date must be on or after start date', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Reason is required', 'error');
      return;
    }
    submitMutation.mutate();
  }, [leaveTypeId, startDate, endDate, reason, submitMutation, showToast]);

  if (typesError) {
    return (
      <View style={styles.root}>
        <AppHeader title="Apply for Leave" />
        <ScreenWrapper scroll={false}>
          <Text style={styles.errorText}>Failed to load leave types.</Text>
        </ScreenWrapper>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader title="Apply for Leave" />
      <ScreenWrapper scroll contentContainerStyle={styles.content} loading={typesLoading && types.length === 0}>
        <Card style={styles.card}>
          <Text style={styles.label}>Leave type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {types.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.chip, leaveTypeId === t.id && styles.chipActive]}
                onPress={() => setLeaveTypeId(t.id)}
              >
                <Text style={[styles.chipText, leaveTypeId === t.id && styles.chipTextActive]}>{t.name ?? t.id}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {types.length === 0 && !typesLoading && <Text style={styles.muted}>No leave types available.</Text>}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Start date</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>End date</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
          {days > 0 && (
            <View style={styles.dayRow}>
              <Text style={styles.dayLabel}>Days</Text>
              <Text style={styles.dayValue}>{days}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Reason (required)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Enter reason"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.label}>Comment (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={comment}
            onChangeText={setComment}
            placeholder="Additional comments"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
          />
        </Card>

        <PrimaryButton
          title={submitMutation.isPending ? 'Submitting…' : 'Submit request'}
          onPress={handleSubmit}
          loading={submitMutation.isPending}
          disabled={submitMutation.isPending}
        />
        <View style={styles.bottomPad} />
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { marginBottom: s.lg },
  label: { ...textStyles.caption, color: colors.textMuted, marginBottom: s.xs, marginTop: s.sm },
  chipRow: { marginBottom: s.xs },
  chip: {
    paddingHorizontal: s.lg,
    paddingVertical: s.sm,
    borderRadius: 9999,
    marginRight: s.sm,
    backgroundColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  chipTextActive: { color: '#fff' },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: s.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: s.sm,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: s.sm },
  dayLabel: { fontSize: 14, color: colors.textMuted },
  dayValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  errorText: { ...textStyles.body, color: colors.danger, padding: s.lg },
  bottomPad: { height: 40 },
});
