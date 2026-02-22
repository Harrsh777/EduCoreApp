/**
 * Change Password: current, new, confirm; validation (match confirm, min 8 chars). POST /api/staff/change-password.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { passwordService } from '@/services/password.service';
import { useToastStore } from '@/lib/toast';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, PrimaryButton, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;
const MIN_PASSWORD_LENGTH = 8;

export default function TeacherChangePasswordScreen() {
  const router = useRouter();
  const { schoolCode, teacher } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      passwordService.changeStaffPassword({
        school_code: schoolCode,
        staff_id: teacher?.staff_id ?? teacher?.id ?? '',
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: () => {
      showToast('Password changed', 'success');
      router.back();
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Failed', 'error');
    },
  });

  const handleSubmit = useCallback(() => {
    if (!currentPassword.trim()) {
      showToast('Enter current password', 'error');
      return;
    }
    if (!newPassword.trim()) {
      showToast('Enter new password', 'error');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      showToast(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`, 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm do not match', 'error');
      return;
    }
    mutation.mutate();
  }, [currentPassword, newPassword, confirmPassword, mutation, showToast]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader title="Change Password" />
      <ScreenWrapper scroll contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
          <Text style={styles.label}>New password (min {MIN_PASSWORD_LENGTH} characters)</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
          <View style={styles.submitWrap}>
            <PrimaryButton
              title={mutation.isPending ? 'Changing…' : 'Change password'}
              onPress={handleSubmit}
              loading={mutation.isPending}
              disabled={mutation.isPending}
            />
          </View>
        </Card>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { marginBottom: s.lg },
  label: { ...textStyles.caption, color: colors.textMuted, marginBottom: s.xs, marginTop: s.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: s.md, paddingVertical: s.sm, fontSize: 14, color: colors.textPrimary, marginBottom: s.sm },
  submitWrap: { marginTop: s.xl },
});
