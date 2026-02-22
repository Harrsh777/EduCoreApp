/**
 * Report: report type selector, params, result. GET /api/reports/student, staff, marks, etc.
 * Visible if view_reports. Same APIs as admin.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { reportsService } from '@/services/reports.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const G = '#16A34A';

type ReportType = 'student' | 'staff' | 'marks' | 'financial' | 'examination' | 'leave' | 'transport' | 'library';

export default function TeacherReportsScreen() {
  const router = useRouter();
  const { schoolCode } = useTeacher();
  const [reportType, setReportType] = useState<ReportType>('student');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', reportType, schoolCode],
    queryFn: () => {
      switch (reportType) {
        case 'student': return reportsService.getReportStudent(schoolCode).then((r) => r.data);
        case 'staff': return reportsService.getReportStaff(schoolCode).then((r) => r.data);
        case 'marks': return reportsService.getReportMarks(schoolCode).then((r) => r.data);
        case 'financial': return reportsService.getReportFinancial(schoolCode).then((r) => r.data);
        case 'examination': return reportsService.getReportExamination(schoolCode).then((r) => r.data);
        case 'leave': return reportsService.getReportLeave(schoolCode).then((r) => r.data);
        case 'transport': return reportsService.getReportTransport(schoolCode).then((r) => r.data);
        case 'library': return reportsService.getReportLibrary(schoolCode).then((r) => r.data);
        default: return reportsService.getReportStudent(schoolCode).then((r) => r.data);
      }
    },
    enabled: Boolean(schoolCode),
  });

  const types: { id: ReportType; label: string }[] = [
    { id: 'student', label: 'Student' },
    { id: 'staff', label: 'Staff' },
    { id: 'marks', label: 'Marks' },
    { id: 'financial', label: 'Financial' },
    { id: 'examination', label: 'Examination' },
    { id: 'leave', label: 'Leave' },
    { id: 'transport', label: 'Transport' },
    { id: 'library', label: 'Library' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: G }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Reports</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Report type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {types.map((t) => (
            <Pressable key={t.id} style={[styles.chip, reportType === t.id && { backgroundColor: G }]} onPress={() => setReportType(t.id)}>
              <Text style={[styles.chipText, reportType === t.id && { color: '#fff' }]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {isLoading ? (
          <ActivityIndicator size="small" color={G} style={styles.loader} />
        ) : isError ? (
          <View>
            <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load'}</Text>
            <Pressable onPress={() => refetch()}><Text style={[styles.retry, { color: G }]}>Retry</Text></Pressable>
          </View>
        ) : data != null ? (
          <Text style={styles.hint}>Report data loaded. Use web app for full export.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', minHeight: 56 },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  sectionTitle: { ...textStyles.h4, color: '#111827', marginBottom: spacing[2] },
  chipRow: { marginBottom: spacing[4] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 8, marginRight: spacing[2], backgroundColor: '#E5E7EB' },
  chipText: { ...textStyles.body, color: '#374151' },
  loader: { marginVertical: spacing[4] },
  error: { ...textStyles.body, color: '#B91C1C', marginBottom: spacing[2] },
  retry: { ...textStyles.button },
  hint: { ...textStyles.body, color: '#6B7280' },
});
