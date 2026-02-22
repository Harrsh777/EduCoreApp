/**
 * Add student: form same as web; POST /api/students.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';
import { useToastStore } from '@/lib/toast';
import { Button } from '@/components/ui';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

const defaultForm = {
  name: '',
  admission_no: '',
  class: '',
  section: '',
  father_name: '',
  mother_name: '',
  phone: '',
  address: '',
  dob: '',
};

export default function AddStudentScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => schoolService.createStudent(schoolCode, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', schoolCode] });
      showToast('Student added', 'success');
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
    if (!form.admission_no?.trim()) {
      showToast('Admission number is required', 'error');
      return;
    }
    mutation.mutate({ ...form });
  }, [form, mutation, showToast]);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Add Student</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FloatingLabelInput label="Name *" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
          <FloatingLabelInput label="Admission no *" value={form.admission_no} onChangeText={(v) => setForm((f) => ({ ...f, admission_no: v }))} />
          <FloatingLabelInput label="Class" value={form.class} onChangeText={(v) => setForm((f) => ({ ...f, class: v }))} />
          <FloatingLabelInput label="Section" value={form.section} onChangeText={(v) => setForm((f) => ({ ...f, section: v }))} />
          <FloatingLabelInput label="Father name" value={form.father_name} onChangeText={(v) => setForm((f) => ({ ...f, father_name: v }))} />
          <FloatingLabelInput label="Mother name" value={form.mother_name} onChangeText={(v) => setForm((f) => ({ ...f, mother_name: v }))} />
          <FloatingLabelInput label="Phone" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
          <FloatingLabelInput label="Address" value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} />
          <FloatingLabelInput label="DOB" value={form.dob} onChangeText={(v) => setForm((f) => ({ ...f, dob: v }))} placeholder="YYYY-MM-DD" />
          <Button title="Add student" onPress={handleSubmit} loading={mutation.isPending} style={styles.submitBtn} />
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
