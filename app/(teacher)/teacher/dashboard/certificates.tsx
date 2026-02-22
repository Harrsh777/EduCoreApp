/**
 * Certificate Management: class/student selector, certificate type, form, generate/upload, list issued.
 * GET /api/classes/teacher, GET /api/students, GET /api/certificates/simple, POST /api/certificates/simple/upload.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { teacherService } from '@/services/teacher.service';
import { schoolService } from '@/services/school.service';
import { certificateService } from '@/services/certificate.service';
import { useToastStore } from '@/lib/toast';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, PrimaryButton, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

export default function TeacherCertificatesScreen() {
  const { schoolCode, teacher } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const teacherId = teacher?.id ?? '';
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [certType, setCertType] = useState('');
  const [formFields, setFormFields] = useState<Record<string, string>>({});

  const { data: classesData } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacherId],
    queryFn: () => teacherService.getClasses({ school_code: schoolCode, teacher_id: teacherId }).then((r) => (r as { data?: unknown[] })?.data ?? []),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: studentsData } = useQuery({
    queryKey: ['students', schoolCode, classId],
    queryFn: () => schoolService.getStudents(schoolCode, classId ? { class: classId } : undefined).then((r) => (r as { data?: unknown[] })?.data ?? []),
    enabled: Boolean(schoolCode),
  });
  const { data: certTypesData, isLoading: typesLoading } = useQuery({
    queryKey: ['certificates', 'simple', 'types', schoolCode],
    queryFn: () => certificateService.getCertificatesSimple(schoolCode).then((r) => (r as { data?: { types?: { id: string; name?: string }[] }; data?: unknown[] })?.data),
    enabled: Boolean(schoolCode),
  });

  const classesList = (Array.isArray(classesData) ? classesData : []) as { id?: string; class_name?: string; name?: string; section?: string }[];
  const studentsList = (Array.isArray(studentsData) ? studentsData : []) as { id?: string; name?: string; admission_no?: string }[];
  const typesRaw = certTypesData as { types?: { id: string; name?: string }[] } | undefined;
  const certTypes = typesRaw?.types ?? (Array.isArray(certTypesData) ? certTypesData : []) as { id: string; name?: string }[];

  const uploadMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      certificateService.uploadCertificateSimple(schoolCode, { school_code: schoolCode, ...body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates', schoolCode] });
      showToast('Certificate uploaded', 'success');
    },
    onError: (err: Error) => showToast(err?.message ?? 'Upload failed', 'error'),
  });

  return (
    <View style={styles.root}>
      <AppHeader title="Certificates" />
      <ScreenWrapper scroll contentContainerStyle={styles.content} loading={typesLoading && certTypes.length === 0}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Issue certificate</Text>
          <Text style={styles.label}>Class</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            <Pressable style={[styles.chip, !classId && styles.chipActive]} onPress={() => setClassId('')}>
              <Text style={[styles.chipText, !classId && styles.chipTextActive]}>All</Text>
            </Pressable>
            {classesList.map((c) => (
              <Pressable key={c.id} style={[styles.chip, classId === c.id && styles.chipActive]} onPress={() => setClassId(c.id ?? '')}>
                <Text style={[styles.chipText, classId === c.id && styles.chipTextActive]}>{c.class_name ?? c.name ?? c.id} {c.section ?? ''}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.label}>Student</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {studentsList.slice(0, 20).map((st) => (
              <Pressable key={st.id} style={[styles.chip, studentId === st.id && styles.chipActive]} onPress={() => setStudentId(st.id ?? '')}>
                <Text style={[styles.chipText, studentId === st.id && styles.chipTextActive]} numberOfLines={1}>{st.name ?? st.admission_no ?? st.id}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.label}>Certificate type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {certTypes.map((t) => (
              <Pressable key={t.id} style={[styles.chip, certType === t.id && styles.chipActive]} onPress={() => setCertType(t.id)}>
                <Text style={[styles.chipText, certType === t.id && styles.chipTextActive]}>{t.name ?? t.id}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.label}>Additional details (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Remarks / reference"
            placeholderTextColor={colors.textMuted}
            value={formFields.remarks ?? ''}
            onChangeText={(v) => setFormFields((p) => ({ ...p, remarks: v }))}
          />
          <View style={styles.actions}>
            <PrimaryButton title="Generate" onPress={() => showToast('Generate: connect to template API', 'info')} variant="outline" />
            <PrimaryButton
              title="Upload"
              onPress={() => {
                if (!studentId || !certType) {
                  showToast('Select student and certificate type', 'error');
                  return;
                }
                uploadMutation.mutate({ student_id: studentId, certificate_type: certType, ...formFields });
              }}
              loading={uploadMutation.isPending}
              disabled={uploadMutation.isPending}
            />
          </View>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Issued certificates</Text>
          <Text style={styles.empty}>List loads from GET /api/certificates/simple with filters.</Text>
        </Card>
        <View style={styles.bottomPad} />
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { marginBottom: s.lg },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary, marginBottom: s.md },
  label: { ...textStyles.caption, color: colors.textMuted, marginTop: s.sm, marginBottom: s.xs },
  chipRow: { marginBottom: s.sm },
  chip: { paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: 9999, marginRight: s.sm, backgroundColor: colors.border },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  chipTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: s.md, fontSize: 14, color: colors.textPrimary, marginTop: s.xs },
  actions: { flexDirection: 'row', gap: s.md, marginTop: s.lg },
  empty: { ...textStyles.caption, color: colors.textMuted },
  bottomPad: { height: 40 },
});
