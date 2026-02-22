import { useLocalSearchParams } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { SectionHeader, Button, LoadingSkeleton, EmptyState } from '@/components/ui';
import { examinationService } from '@/services/examination.service';
import { schoolService } from '@/services/school.service';
import { useToastStore } from '@/lib/toast';

type MarkRow = { student_id: string; student_name?: string; subject_id?: string; marks?: number; grade?: string };

export default function MarksEntryScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const [localMarks, setLocalMarks] = useState<Record<string, number>>({});

  const { data: marksData, isLoading, isError, error } = useQuery({
    queryKey: ['school', 'examination-marks', school_code, examId],
    queryFn: async () => {
      if (!school_code || !examId) throw new Error('Missing params');
      const res = await examinationService.getExaminationMarks(school_code, { exam_id: examId! });
      return res.data;
    },
    enabled: Boolean(school_code && examId),
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: { exam_id: string; marks: Array<{ student_id: string; subject_id?: string; marks: number }> }) => {
      if (!school_code) throw new Error('No school');
      return examinationService.submitMarks(school_code, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', 'examination-marks'] });
      showToast('Marks saved', 'success');
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed to save', 'error'),
  });

  const rows = (marksData as { rows?: MarkRow[] })?.rows ?? [];
  const getKey = (studentId: string, subjectId?: string) => (subjectId ? `${studentId}_${subjectId}` : studentId);

  const handleMarksChange = useCallback((key: string, value: string) => {
    const num = value === '' ? 0 : parseInt(value, 10);
    setLocalMarks((prev) => ({ ...prev, [key]: isNaN(num) ? prev[key] ?? 0 : num }));
  }, []);

  const handleSaveBatch = useCallback(() => {
    if (!examId) return;
    const marks = Object.entries(localMarks).map(([key, marksVal]) => {
      const [studentId, subjectId] = key.includes('_') ? key.split('_') : [key, undefined];
      return { student_id: studentId, subject_id: subjectId, marks: marksVal };
    });
    if (marks.length === 0) {
      showToast('No marks to save', 'info');
      return;
    }
    submitMutation.mutate({ exam_id: examId, marks });
  }, [examId, localMarks, submitMutation, showToast]);

  if (!school_code || !examId) return null;
  if (isLoading && !marksData) return <LoadingSkeleton />;
  if (isError) {
    return (
      <View style={[styles.centered, { padding: spacing[6] }]}>
        <EmptyState title="Failed to load" message={error?.message ?? 'Unknown error'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader title="Marks Entry" />
      <ScrollView horizontal style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          <View style={[styles.row, styles.headerRow, { borderBottomColor: c.border.default }]}>
            <Text style={[styles.cell, styles.headerCell, { color: c.text.secondary }]}>Student</Text>
            <Text style={[styles.cell, styles.headerCell, { color: c.text.secondary }]}>Marks</Text>
          </View>
          {rows.map((row) => {
            const key = getKey(row.student_id, row.subject_id);
            const value = localMarks[key] ?? row.marks ?? '';
            return (
              <View key={key} style={[styles.row, { borderBottomColor: c.border.default }]}>
                <Text style={[styles.cell, { color: c.text.primary }]} numberOfLines={1}>
                  {row.student_name ?? row.student_id}
                </Text>
                <TextInput
                  style={[styles.input, { color: c.text.primary, borderColor: c.border.default }]}
                  value={String(value)}
                  onChangeText={(v) => handleMarksChange(key, v)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
      <View style={[styles.footer, { padding: spacing[4], borderTopColor: c.border.default }]}>
        <Button title="Save batch" onPress={handleSaveBatch} loading={submitMutation.isPending} />
      </View>
    </View>
  );
}

const cellWidth = 120;
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  grid: {},
  row: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 8 },
  headerRow: { paddingVertical: 12 },
  cell: { width: cellWidth, paddingHorizontal: 8, fontSize: 14 },
  headerCell: { fontWeight: '600' },
  input: { width: cellWidth, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderRadius: 6, fontSize: 14 },
  footer: { borderTopWidth: 1 },
});
