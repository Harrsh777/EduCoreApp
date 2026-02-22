/**
 * Password Manager: list credentials, reset staff/student password.
 * APIs: GET /api/dashboard/login-credentials, POST /api/staff/reset-password, POST /api/students/reset-password.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { passwordService } from '@/services/password.service';
import { useToastStore } from '@/lib/toast';
import { Button, SectionHeader, EmptyState } from '@/components/ui';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

type Credential = {
  id?: string;
  type: 'staff' | 'student';
  staff_id?: string;
  admission_no?: string;
  student_id?: string;
  name?: string;
  [k: string]: unknown;
};

export default function PasswordScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [resetModal, setResetModal] = useState<Credential | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: credsRes, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['login-credentials', schoolCode],
    queryFn: () => passwordService.getLoginCredentials(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const raw = credsRes as { staff?: Credential[]; students?: Credential[]; data?: { staff?: Credential[]; students?: Credential[] } } | undefined;
  const data = raw?.data ?? raw;
  const staffList = (data?.staff ?? []) as Credential[];
  const studentList = (data?.students ?? []) as Credential[];
  const staffWithType = staffList.map((s) => ({ ...s, type: 'staff' as const }));
  const studentsWithType = studentList.map((s) => ({ ...s, type: 'student' as const }));
  const credentials = [...staffWithType, ...studentsWithType];

  const resetStaffMutation = useMutation({
    mutationFn: (body: { school_code: string; staff_id: string; new_password: string }) =>
      passwordService.resetStaffPassword(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['login-credentials', schoolCode] });
      showToast('Password reset', 'success');
      setResetModal(null);
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Reset failed', 'error');
    },
  });

  const resetStudentMutation = useMutation({
    mutationFn: (body: { school_code: string; admission_no?: string; student_id?: string; new_password: string }) =>
      passwordService.resetStudentPassword(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['login-credentials', schoolCode] });
      showToast('Password reset', 'success');
      setResetModal(null);
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Reset failed', 'error');
    },
  });

  const handleReset = useCallback(() => {
    if (!resetModal) return;
    if (!newPassword || newPassword.length < 4) {
      showToast('Password must be at least 4 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (resetModal.type === 'staff') {
      const staffId = resetModal.staff_id ?? resetModal.id;
      if (!staffId) {
        showToast('Staff ID missing', 'error');
        return;
      }
      resetStaffMutation.mutate({ school_code: schoolCode, staff_id: String(staffId), new_password: newPassword });
    } else {
      const admissionNo = resetModal.admission_no ?? resetModal.student_id ?? resetModal.id;
      if (!admissionNo) {
        showToast('Student ID / Admission no missing', 'error');
        return;
      }
      resetStudentMutation.mutate({
        school_code: schoolCode,
        admission_no: String(admissionNo),
        new_password: newPassword,
      });
    }
  }, [resetModal, newPassword, confirmPassword, schoolCode, showToast, resetStaffMutation, resetStudentMutation]);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Password Manager</Text>
      </View>
      {isLoading && !credentials.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={INDIGO} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load credentials'}</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : credentials.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState title="No credentials" message="No staff or student login credentials found." />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <SectionHeader title="Login credentials" />
          {credentials.map((c, i) => {
            const id = c.staff_id ?? c.admission_no ?? c.student_id ?? c.id ?? String(i);
            const label = c.type === 'staff' ? `Staff: ${c.staff_id ?? id}` : `Student: ${c.admission_no ?? c.student_id ?? id}`;
            const name = c.name ?? '—';
            return (
              <Pressable
                key={id}
                style={styles.card}
                onPress={() => {
                  setResetModal(c);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>{label}</Text>
                  <Text style={styles.cardName}>{name}</Text>
                </View>
                <Text style={styles.resetHint}>Tap to reset password</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Reset password modal */}
      <Modal visible={!!resetModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setResetModal(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <SectionHeader title={resetModal ? `Reset: ${resetModal.name ?? resetModal.staff_id ?? resetModal.admission_no ?? 'User'}` : 'Reset password'} />
              <FloatingLabelInput
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <FloatingLabelInput
                label="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setResetModal(null)} />
                <Button
                  title="Reset"
                  onPress={handleReset}
                  loading={resetStaffMutation.isPending || resetStudentMutation.isPending}
                />
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2] },
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[12] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[6] },
  errorText: { ...textStyles.bodySm, color: '#B91C1C', marginBottom: spacing[4] },
  retryBtn: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  retryText: { ...textStyles.button, color: INDIGO },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  cardLabel: { ...textStyles.body, color: '#111827', fontWeight: '600' },
  cardName: { ...textStyles.bodySm, color: '#6B7280' },
  resetHint: { ...textStyles.caption, color: INDIGO, marginTop: spacing[2] },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing[6],
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing[6],
  },
  modalActions: { flexDirection: 'row', gap: spacing[4], marginTop: spacing[6], justifyContent: 'flex-end' },
});
