/**
 * Institute Info: load, display, edit, PATCH save.
 * APIs: GET /api/schools/accepted, GET /api/institute/..., PATCH /api/institute/...
 */

import { useRouter } from 'expo-router';
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
import { instituteService } from '@/services/institute.service';
import { useToastStore } from '@/lib/toast';
import { Button, SectionHeader } from '@/components/ui';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { areaPalettes } from '@/theme/areaPalettes';

const palette = areaPalettes.adminLogin;

export default function InstituteInfoScreen() {
  const router = useRouter();
  const { schoolCode, path } = useSchoolCode();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ school_name: '', school_address: '', city: '', state: '', zip_code: '', country: '', school_email: '', school_phone: '' });

  const { data: queryData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['institute', schoolCode],
    queryFn: async () => {
      const [accepted, workingDays, houses] = await Promise.all([
        instituteService.getAcceptedSchools({ school_code: schoolCode }).then((r) => r.data),
        instituteService.getInstituteWorkingDays(schoolCode).then((r) => r.data).catch(() => null),
        instituteService.getInstituteHouses(schoolCode).then((r) => r.data).catch(() => null),
      ]);
      const list = Array.isArray(accepted) ? accepted : (accepted as { data?: unknown[] })?.data ?? [];
      const row = list.find((s: { school_code?: string }) => s.school_code === schoolCode) as Record<string, unknown> | undefined;
      return { school: row ?? {}, workingDays: workingDays ?? {}, houses: houses ?? {} };
    },
    enabled: Boolean(schoolCode),
  });

  const schoolRow = (queryData?.school ?? {}) as Record<string, unknown>;

  useEffect(() => {
    if (!queryData?.school) return;
    const s = queryData.school as Record<string, unknown>;
    setForm((prev) =>
      prev.school_name === '' && !editing
        ? {
            school_name: String(s.school_name ?? ''),
            school_address: String(s.school_address ?? ''),
            city: String(s.city ?? ''),
            state: String(s.state ?? ''),
            zip_code: String(s.zip_code ?? ''),
            country: String(s.country ?? ''),
            school_email: String(s.school_email ?? ''),
            school_phone: String(s.school_phone ?? ''),
          }
        : prev
    );
  }, [queryData?.school, editing]);

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      await instituteService.patchInstitute(schoolCode, 'profile', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institute', schoolCode] });
      showToast('Saved', 'success');
      setEditing(false);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Save failed', 'error');
    },
  });

  const handleSave = useCallback(() => {
    saveMutation.mutate(form);
  }, [form, saveMutation]);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Institute Info</Text>
        {!editing ? (
          <Pressable
            style={styles.headerBtn}
            onPress={() => {
              const s = schoolRow;
              setForm({
                school_name: String(s.school_name ?? ''),
                school_address: String(s.school_address ?? ''),
                city: String(s.city ?? ''),
                state: String(s.state ?? ''),
                zip_code: String(s.zip_code ?? ''),
                country: String(s.country ?? ''),
                school_email: String(s.school_email ?? ''),
                school_phone: String(s.school_phone ?? ''),
              });
              setEditing(true);
            }}
          >
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.headerBtn} onPress={() => setEditing(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {isLoading && !queryData ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          ) : isError ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load'}</Text>
              <Pressable style={styles.retryBtn} onPress={() => refetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : editing ? (
            <View style={styles.form}>
              <FloatingLabelInput label="School name" value={form.school_name} onChangeText={(v) => setForm((f) => ({ ...f, school_name: v }))} />
              <FloatingLabelInput label="Address" value={form.school_address} onChangeText={(v) => setForm((f) => ({ ...f, school_address: v }))} />
              <FloatingLabelInput label="City" value={form.city} onChangeText={(v) => setForm((f) => ({ ...f, city: v }))} />
              <FloatingLabelInput label="State" value={form.state} onChangeText={(v) => setForm((f) => ({ ...f, state: v }))} />
              <FloatingLabelInput label="Zip" value={form.zip_code} onChangeText={(v) => setForm((f) => ({ ...f, zip_code: v }))} keyboardType="numeric" />
              <FloatingLabelInput label="Country" value={form.country} onChangeText={(v) => setForm((f) => ({ ...f, country: v }))} />
              <FloatingLabelInput label="Email" value={form.school_email} onChangeText={(v) => setForm((f) => ({ ...f, school_email: v }))} keyboardType="email-address" />
              <FloatingLabelInput label="Phone" value={form.school_phone} onChangeText={(v) => setForm((f) => ({ ...f, school_phone: v }))} keyboardType="phone-pad" />
              <Button title="Save" onPress={handleSave} loading={saveMutation.isPending} style={styles.saveBtn} />
            </View>
          ) : (
            <View style={styles.readOnly}>
              <SectionHeader title="School" />
              <Row label="Name" value={String(schoolRow.school_name ?? '—')} />
              <Row label="Address" value={String(schoolRow.school_address ?? '—')} />
              <Row label="City" value={String(schoolRow.city ?? '—')} />
              <Row label="State" value={String(schoolRow.state ?? '—')} />
              <Row label="Zip" value={String(schoolRow.zip_code ?? '—')} />
              <Row label="Country" value={String(schoolRow.country ?? '—')} />
              <Row label="Email" value={String(schoolRow.school_email ?? '—')} />
              <Row label="Phone" value={String(schoolRow.school_phone ?? '—')} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    minHeight: 56,
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2] },
  backText: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  headerBtn: { padding: spacing[2] },
  editText: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  cancelText: { fontSize: 16, color: '#6B7280' },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  centered: { paddingVertical: spacing[12], alignItems: 'center' },
  errorText: { ...textStyles.bodySm, color: '#B91C1C', marginBottom: spacing[4] },
  retryBtn: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  retryText: { ...textStyles.button, color: '#4F46E5' },
  form: {},
  saveBtn: { marginTop: spacing[6] },
  readOnly: {},
  row: { marginBottom: spacing[4], paddingBottom: spacing[2], borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  rowLabel: { ...textStyles.caption, color: '#6B7280', marginBottom: 2 },
  rowValue: { ...textStyles.body, color: '#111827' },
});
