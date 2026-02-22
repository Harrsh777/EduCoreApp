/**
 * Student Leave Approvals (class teacher only): list pending, Approve/Reject, optional remarks.
 * GET /api/leave/student-requests/class-teacher, PATCH class-teacher-approval.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { leaveService } from '@/services/leave.service';
import { useToastStore } from '@/lib/toast';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, PrimaryButton, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

type Request = {
  id: string;
  student_name?: string;
  class_name?: string;
  section?: string;
  leave_type_name?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  status?: string;
};

export default function TeacherStudentLeaveApprovalsScreen() {
  const { schoolCode, teacher, isClassTeacher } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [remarksModal, setRemarksModal] = useState<{ requestId: string; action: 'approve' | 'reject' } | null>(null);
  const [remarks, setRemarks] = useState('');

  const staffId = teacher?.staff_id ?? teacher?.id ?? '';
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['leave', 'student-requests', 'class-teacher', schoolCode, staffId],
    queryFn: () =>
      leaveService.getStudentLeaveRequestsClassTeacher(schoolCode, staffId).then((r) => (r as { data?: Request[] })?.data ?? []),
    enabled: Boolean(schoolCode && staffId && isClassTeacher),
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, remarks: r }: { requestId: string; remarks?: string }) =>
      leaveService.patchStudentLeaveApproval(schoolCode, requestId, { status: 'approved', ...(r ? { remarks: r } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'student-requests', 'class-teacher', schoolCode, staffId] });
      showToast('Approved', 'success');
      setRemarksModal(null);
      setRemarks('');
      refetch();
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed', 'error'),
  });
  const rejectMutation = useMutation({
    mutationFn: ({ requestId, remarks: r }: { requestId: string; remarks?: string }) =>
      leaveService.patchStudentLeaveApproval(schoolCode, requestId, { status: 'rejected', ...(r ? { remarks: r } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'student-requests', 'class-teacher', schoolCode, staffId] });
      showToast('Rejected', 'success');
      setRemarksModal(null);
      setRemarks('');
      refetch();
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed', 'error'),
  });

  const list = (Array.isArray(data) ? data : []) as Request[];
  const pending = list.filter((r) => (r.status ?? 'pending').toLowerCase() === 'pending');

  const openRemarks = (requestId: string, action: 'approve' | 'reject') => {
    setRemarksModal({ requestId, action });
    setRemarks('');
  };
  const submitRemarks = () => {
    if (!remarksModal) return;
    if (remarksModal.action === 'approve') {
      approveMutation.mutate({ requestId: remarksModal.requestId, remarks: remarks.trim() || undefined });
    } else {
      rejectMutation.mutate({ requestId: remarksModal.requestId, remarks: remarks.trim() || undefined });
    }
  };

  if (!isClassTeacher) {
    return (
      <View style={styles.root}>
        <AppHeader title="Student Leave Approvals" />
        <ScreenWrapper scroll={false}>
          <Card style={styles.messageCard}>
            <Text style={styles.messageTitle}>Not assigned as class teacher</Text>
            <Text style={styles.messageText}>Student leave approvals are only available for class teachers.</Text>
          </Card>
        </ScreenWrapper>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <AppHeader title="Student Leave Approvals" />
        <ScreenWrapper scroll={false}>
          <Text style={styles.errorText}>Failed to load requests.</Text>
        </ScreenWrapper>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppHeader title="Student Leave Approvals" />
      <ScreenWrapper
        scroll
        refreshing={false}
        onRefresh={() => refetch()}
        loading={isLoading && list.length === 0}
        contentContainerStyle={styles.content}
      >
        {pending.map((r) => (
          <Card key={r.id} style={styles.card}>
            <Text style={styles.cardTitle}>{r.student_name ?? 'Student'}</Text>
            <Text style={styles.cardMeta}>
              {[r.class_name, r.section].filter(Boolean).join(' • ')} {r.leave_type_name ? `• ${r.leave_type_name}` : ''}
            </Text>
            <Text style={styles.cardDates}>{r.start_date ?? ''} – {r.end_date ?? ''}</Text>
            {r.reason ? <Text style={styles.cardReason} numberOfLines={3}>{r.reason}</Text> : null}
            <View style={styles.actions}>
              <Pressable
                style={styles.rejectBtn}
                onPress={() => openRemarks(r.id, 'reject')}
                disabled={rejectMutation.isPending || approveMutation.isPending}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </Pressable>
              <Pressable
                style={styles.approveBtn}
                onPress={() => openRemarks(r.id, 'approve')}
                disabled={rejectMutation.isPending || approveMutation.isPending}
              >
                <Text style={styles.approveText}>Approve</Text>
              </Pressable>
            </View>
          </Card>
        ))}
        {pending.length === 0 && !isLoading && (
          <Text style={styles.empty}>No pending student leave requests.</Text>
        )}
        <View style={styles.bottomPad} />
      </ScreenWrapper>

      <Modal visible={!!remarksModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{remarksModal?.action === 'approve' ? 'Approve with remarks' : 'Reject with remarks'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Remarks (optional)"
              placeholderTextColor={colors.textMuted}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <PrimaryButton title="Cancel" variant="outline" onPress={() => { setRemarksModal(null); setRemarks(''); }} />
              <PrimaryButton
                title={remarksModal?.action === 'approve' ? 'Approve' : 'Reject'}
                onPress={submitRemarks}
                loading={approveMutation.isPending || rejectMutation.isPending}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  messageCard: { margin: s.lg },
  messageTitle: { ...textStyles.h4, color: colors.textPrimary, marginBottom: s.sm },
  messageText: { ...textStyles.body, color: colors.textMuted },
  card: { marginBottom: s.lg },
  cardTitle: { ...textStyles.body, fontWeight: '600', color: colors.textPrimary },
  cardMeta: { ...textStyles.caption, color: colors.textMuted, marginTop: 2 },
  cardDates: { ...textStyles.caption, color: colors.textSecondary, marginTop: 2 },
  cardReason: { ...textStyles.caption, color: colors.textMuted, marginTop: s.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: s.md, marginTop: s.lg },
  rejectBtn: { paddingVertical: s.sm, paddingHorizontal: s.lg, borderRadius: 9999, backgroundColor: colors.dangerLight },
  rejectText: { fontSize: 14, fontWeight: '600', color: colors.danger },
  approveBtn: { paddingVertical: s.sm, paddingHorizontal: s.lg, borderRadius: 9999, backgroundColor: colors.primary },
  approveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  empty: { ...textStyles.body, color: colors.textMuted, textAlign: 'center', marginTop: s.xl },
  errorText: { ...textStyles.body, color: colors.danger, padding: s.lg },
  bottomPad: { height: 40 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: s.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox: { backgroundColor: colors.surface, borderRadius: 16, padding: s.xl },
  modalTitle: { ...textStyles.h4, color: colors.textPrimary, marginBottom: s.md },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: s.md, fontSize: 14, color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top', marginBottom: s.lg },
  modalActions: { flexDirection: 'row', gap: s.md, justifyContent: 'flex-end' },
});
