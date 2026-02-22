/**
 * Marks: GET /api/marks/view, report-card, bulk-download, export. Tables: student_exam_summary, student_subject_marks, examinations, students, accepted_schools, classes.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { marksService } from '@/services/marks.service';
import { schoolService } from '@/services/school.service';
import { examinationService } from '@/services/examination.service';
import { SectionHeader } from '@/components/ui';
import { Button } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function MarksScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');

  const { data: classesData } = useQuery({
    queryKey: ['classes', schoolCode],
    queryFn: () => schoolService.getClasses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: examsData } = useQuery({
    queryKey: ['examinations', 'v2', schoolCode],
    queryFn: () => examinationService.getExaminationsList(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const { data: marksData, isLoading } = useQuery({
    queryKey: ['marks', 'view', schoolCode, examId, classId],
    queryFn: () => marksService.getMarksView(schoolCode, { exam_id: examId, class_id: classId }).then((r) => r.data),
    enabled: Boolean(schoolCode && (examId || classId)),
  });

  const classesList = Array.isArray(classesData) ? classesData : (classesData as { data?: { id: string; name?: string }[] })?.data ?? [];
  const examsList = Array.isArray(examsData) ? examsData : (examsData as { data?: { id: string; name?: string }[] })?.data ?? [];

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Marks</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Marks & report card" />
        <Text style={styles.hint}>Select class and exam to view marks. Report card and export use GET /api/marks/report-card and /api/marks/export.</Text>
        {(examId || classId) && isLoading ? (
          <ActivityIndicator size="small" color={INDIGO} style={styles.loader} />
        ) : marksData ? (
          <Text style={styles.dataHint}>Marks data loaded. Use web app for full table and export.</Text>
        ) : null}
        <Button title="Report card" variant="outline" onPress={() => marksService.getReportCard(schoolCode)} style={styles.btn} />
        <Button title="Bulk download" variant="outline" onPress={() => marksService.getBulkDownload(schoolCode)} style={styles.btn} />
        <Button title="Export" variant="outline" onPress={() => marksService.getMarksExport(schoolCode)} style={styles.btn} />
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
    minHeight: 56,
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  hint: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[4] },
  loader: { marginVertical: spacing[4] },
  dataHint: { ...textStyles.bodySm, color: '#059669', marginBottom: spacing[4] },
  btn: { marginBottom: spacing[3] },
});
