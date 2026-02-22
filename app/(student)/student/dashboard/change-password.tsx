/**
 * Change Password: POST /api/students/change-password. Same as web; updates student_login.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useStudent } from '@/lib/student-context';
import { passwordService } from '@/services/password.service';
import { useToastStore } from '@/lib/toast';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const STUDENT_BLUE = '#2563EB';

export default function StudentChangePasswordScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const showToast = useToastStore((s) => s.show);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      passwordService.changeStudentPassword({
        school_code: schoolCode,
        student_id: studentId,
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
    if (!currentPassword.trim() || !newPassword.trim()) {
      showToast('Fill current and new password', 'error');
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
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: STUDENT_BLUE }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Change Password</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Current password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current password"
          secureTextEntry
        />
        <Text style={styles.label}>New password</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          secureTextEntry
        />
        <Text style={styles.label}>Confirm new password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm"
          secureTextEntry
        />
        <Pressable
          style={[styles.submitBtn, { backgroundColor: STUDENT_BLUE }]}
          onPress={handleSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Change password</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F9FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 56,
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  label: { ...textStyles.bodySm, color: '#6B7280', marginTop: spacing[4], marginBottom: spacing[1] },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: spacing[3],
    ...textStyles.body,
    marginBottom: spacing[3],
    minHeight: 44,
  },
  submitBtn: {
    marginTop: spacing[6],
    padding: spacing[4],
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  submitText: { ...textStyles.button, color: '#fff' },
});
