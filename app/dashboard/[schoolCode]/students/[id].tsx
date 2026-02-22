/**
 * Student detail: GET /api/students/[id]; edit form PATCH /api/students/[id].
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';
import { useToastStore } from '@/lib/toast';
import { Button, SectionHeader } from '@/components/ui';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function StudentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { schoolCode } = useSchoolCode();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    admission_no: '',
    class: '',
    section: '',
    father_name: '',
    mother_name: '',
    phone: '',
    address: '',
    dob: '',
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['students', id, schoolCode],
    queryFn: () => schoolService.getStudent(id ?? '', schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode && id),
  });

  const student = (data as Record<string, unknown>) ?? {};

  useEffect(() => {
    if (!student || editing) return;
    setForm({
      name: String(student.name ?? ''),
      admission_no: String(student.admission_no ?? ''),
      class: String(student.class ?? ''),
      section: String(student.section ?? ''),
      father_name: String(student.father_name ?? ''),
      mother_name: String(student.mother_name ?? ''),
      phone: String(student.phone ?? ''),
      address: String(student.address ?? ''),
      dob: String(student.dob ?? ''),
    });
  }, [student.name, student.admission_no, student.class, student.section, student.father_name, student.mother_name, student.phone, student.address, student.dob, editing]);

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => schoolService.updateStudent(id ?? '', schoolCode, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', id, schoolCode] });
      queryClient.invalidateQueries({ queryKey: ['students', schoolCode] });
      showToast('Saved', 'success');
      setEditing(false);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Save failed', 'error');
    },
  });

  const handleSave = useCallback(() => {
    updateMutation.mutate(form);
  }, [form, updateMutation]);

  if (!schoolCode || !id) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>{student.name ?? 'Student'}</Text>
        {!editing ? (
          <Pressable style={styles.headerBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.headerBtn} onPress={() => setEditing(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </View>
      {isLoading && !student.id ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={INDIGO} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load student'}</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <SectionHeader title="Student details" />
            {editing ? (
              <>
                <FloatingLabelInput label="Name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                <FloatingLabelInput label="Admission no" value={form.admission_no} onChangeText={(v) => setForm((f) => ({ ...f, admission_no: v }))} />
                <FloatingLabelInput label="Class" value={form.class} onChangeText={(v) => setForm((f) => ({ ...f, class: v }))} />
                <FloatingLabelInput label="Section" value={form.section} onChangeText={(v) => setForm((f) => ({ ...f, section: v }))} />
                <FloatingLabelInput label="Father name" value={form.father_name} onChangeText={(v) => setForm((f) => ({ ...f, father_name: v }))} />
                <FloatingLabelInput label="Mother name" value={form.mother_name} onChangeText={(v) => setForm((f) => ({ ...f, mother_name: v }))} />
                <FloatingLabelInput label="Phone" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
                <FloatingLabelInput label="Address" value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} />
                <FloatingLabelInput label="DOB" value={form.dob} onChangeText={(v) => setForm((f) => ({ ...f, dob: v }))} />
                <Button title="Save" onPress={handleSave} loading={updateMutation.isPending} style={styles.saveBtn} />
              </>
            ) : (
              <View style={styles.readOnly}>
                <Row label="Name" value={String(student.name ?? '—')} />
                <Row label="Admission no" value={String(student.admission_no ?? '—')} />
                <Row label="Class" value={String(student.class ?? '—')} />
                <Row label="Section" value={String(student.section ?? '—')} />
                <Row label="Father" value={String(student.father_name ?? '—')} />
                <Row label="Mother" value={String(student.mother_name ?? '—')} />
                <Row label="Phone" value={String(student.phone ?? '—')} />
                <Row label="Address" value={String(student.address ?? '—')} />
                <Row label="DOB" value={String(student.dob ?? '—')} />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  headerBtn: { padding: spacing[2] },
  editText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  cancelText: { fontSize: 16, color: '#6B7280' },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[6] },
  errorText: { ...textStyles.bodySm, color: '#B91C1C', marginBottom: spacing[4] },
  retryBtn: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  retryText: { ...textStyles.button, color: INDIGO },
  readOnly: {},
  row: { marginBottom: spacing[4], paddingBottom: spacing[2], borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  rowLabel: { ...textStyles.caption, color: '#6B7280', marginBottom: 2 },
  rowValue: { ...textStyles.body, color: '#111827' },
  saveBtn: { marginTop: spacing[6] },
});
