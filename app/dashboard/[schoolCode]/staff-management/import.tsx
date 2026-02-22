/**
 * Bulk import staff: file picker + POST /api/staff/import (same body as web).
 * Install expo-document-picker for file picker.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';
import { useToastStore } from '@/lib/toast';
import { Button, SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function StaffImportScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [file, setFile] = useState<{ name: string; uri: string; type?: string } | null>(null);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => schoolService.importStaff(schoolCode, formData),
    onSuccess: (data: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['staff', schoolCode] });
      const msg = (data as { imported?: number })?.imported != null ? `${(data as { imported: number }).imported} imported` : 'Import completed';
      showToast(msg, 'success');
      router.back();
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Import failed', 'error');
    },
  });

  const pickFile = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker').catch(() => null);
      if (!DocumentPicker) {
        showToast('Install expo-document-picker for file import', 'info');
        return;
      }
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const f = result.assets[0];
      setFile({ name: f.name, uri: f.uri, type: f.mimeType ?? undefined });
    } catch (e) {
      showToast('Could not pick file', 'error');
    }
  };

  const handleUpload = () => {
    if (!file) {
      showToast('Select a file first', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.type ?? 'text/csv' } as unknown as Blob);
    mutation.mutate(formData);
  };

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Bulk import staff</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Upload file" />
        <Text style={styles.hint}>
          Select a CSV or Excel file with columns matching the web import format (name, staff_id, email, etc.).
        </Text>
        <Button title="Choose file" variant="outline" onPress={pickFile} style={styles.chooseBtn} />
        {file ? (
          <View style={styles.fileRow}>
            <Text style={styles.fileName}>{file.name}</Text>
            <Pressable onPress={() => setFile(null)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ) : null}
        <Button title="Upload and import" onPress={handleUpload} loading={mutation.isPending} disabled={!file} style={styles.uploadBtn} />
      </ScrollView>
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
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  hint: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[4] },
  chooseBtn: { marginBottom: spacing[4] },
  fileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[2], marginBottom: spacing[4] },
  fileName: { ...textStyles.body, color: '#111827' },
  removeText: { fontSize: 14, color: '#B91C1C' },
  uploadBtn: { marginTop: spacing[4] },
});
