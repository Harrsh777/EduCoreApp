/**
 * Add staff: form with same fields as web; POST /api/staff.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';
import { useToastStore } from '@/lib/toast';
import { Button, SectionHeader } from '@/components/ui';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

const defaultForm = {
  name: '',
  staff_id: '',
  email: '',
  phone: '',
  role: '',
  designation: '',
  joining_date: '',
  address: '',
};

export default function AddStaffScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => schoolService.createStaff(schoolCode, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', schoolCode] });
      showToast('Staff added', 'success');
      router.back();
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Add failed', 'error');
    },
  });

  const handleSubmit = useCallback(() => {
    if (!form.name?.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (!form.staff_id?.trim()) {
      showToast('Staff ID is required', 'error');
      return;
    }
    const body: Record<string, unknown> = { ...form };
    if (!body.joining_date) delete body.joining_date;
    mutation.mutate(body);
  }, [form, mutation, showToast]);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Add Staff</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SectionHeader title="Staff details" />
          <FloatingLabelInput label="Name *" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
          <FloatingLabelInput label="Staff ID *" value={form.staff_id} onChangeText={(v) => setForm((f) => ({ ...f, staff_id: v }))} />
          <FloatingLabelInput label="Email" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" />
          <FloatingLabelInput label="Phone" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
          <FloatingLabelInput label="Role" value={form.role} onChangeText={(v) => setForm((f) => ({ ...f, role: v }))} />
          <FloatingLabelInput label="Designation" value={form.designation} onChangeText={(v) => setForm((f) => ({ ...f, designation: v }))} />
          <FloatingLabelInput label="Joining date" value={form.joining_date} onChangeText={(v) => setForm((f) => ({ ...f, joining_date: v }))} placeholder="YYYY-MM-DD" />
          <FloatingLabelInput label="Address" value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} />
          <Button title="Add staff" onPress={handleSubmit} loading={mutation.isPending} style={styles.submitBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
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
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  submitBtn: { marginTop: spacing[6] },
});
