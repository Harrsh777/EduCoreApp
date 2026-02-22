/**
 * Mark student attendance: class + date, then list with present/absent; POST /api/attendance/update.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';
import { useToastStore } from '@/lib/toast';
import { Button } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type StudentRow = { id: string; student_id?: string; name?: string; admission_no?: string; [k: string]: unknown };

export default function StudentAttendanceScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayStr());

  const { data: classData, isLoading } = useQuery({
    queryKey: ['classes', schoolCode],
    queryFn: () => schoolService.getClasses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const classesList = Array.isArray(classData) ? classData : (classData as { data?: { id: string; name?: string }[] })?.data ?? [];

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', 'class', schoolCode, classId, date],
    queryFn: () => schoolService.getAttendanceClass(schoolCode, { class_id: classId, date }).then((r) => r.data),
    enabled: Boolean(schoolCode && classId && date),
  });

  const rawStudents = (attendanceData as { students?: StudentRow[]; data?: StudentRow[] })?.students ?? (attendanceData as { data?: StudentRow[] })?.data ?? [];
  const students = (rawStudents ?? []) as StudentRow[];
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: (body: { school_code: string; class_id: string; date: string; attendance: Array<{ student_id: string; status: string }> }) =>
      schoolService.updateAttendance(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'class', schoolCode, classId, date] });
      showToast('Attendance saved', 'success');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Save failed', 'error');
    },
  });

  const handleSave = useCallback(() => {
    if (!classId || !date) {
      showToast('Select class and date', 'error');
      return;
    }
    const list = students.map((s) => ({
      student_id: s.id ?? s.student_id ?? '',
      status: attendance[s.id ?? s.student_id ?? ''] ?? 'present',
    })).filter((x) => x.student_id);
    updateMutation.mutate({ school_code: schoolCode, class_id: classId, date, attendance: list });
  }, [schoolCode, classId, date, students, attendance, updateMutation, showToast]);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Mark attendance</Text>
      </View>
      <View style={styles.filters}>
        <Text style={styles.label}>Class ID</Text>
        <TextInput style={styles.input} value={classId} onChangeText={setClassId} placeholder="Class ID" />
        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      </View>
      {!classId || !date ? (
        <View style={styles.centered}>
          <Text style={styles.hint}>Select class and date to load students.</Text>
        </View>
      ) : loadingAttendance && !students.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={INDIGO} />
        </View>
      ) : students.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.hint}>No students in this class for this date.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {students.map((s) => {
            const sid = s.id ?? s.student_id ?? '';
            const status = attendance[sid] ?? 'present';
            return (
              <View key={sid} style={styles.row}>
                <Text style={styles.rowName}>{s.name ?? s.admission_no ?? sid}</Text>
                <View style={styles.toggle}>
                  <Pressable
                    style={[styles.toggleBtn, status === 'present' && styles.togglePresent]}
                    onPress={() => setAttendance((a) => ({ ...a, [sid]: 'present' }))}
                  >
                    <Text style={status === 'present' ? styles.toggleTextActive : styles.toggleText}>Present</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.toggleBtn, status === 'absent' && styles.toggleAbsent]}
                    onPress={() => setAttendance((a) => ({ ...a, [sid]: 'absent' }))}
                  >
                    <Text style={status === 'absent' ? styles.toggleTextActive : styles.toggleText}>Absent</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          <Button title="Save attendance" onPress={handleSave} loading={updateMutation.isPending} style={styles.saveBtn} />
        </ScrollView>
      )}
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
  filters: { padding: spacing[4], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  label: { ...textStyles.caption, color: '#6B7280', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: spacing[2], marginBottom: spacing[3], ...textStyles.body },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[12] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[6] },
  hint: { ...textStyles.bodySm, color: '#6B7280' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[3], paddingHorizontal: spacing[4], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowName: { ...textStyles.body, color: '#111827', flex: 1 },
  toggle: { flexDirection: 'row', gap: spacing[2] },
  toggleBtn: { paddingVertical: spacing[1], paddingHorizontal: spacing[3], borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  togglePresent: { backgroundColor: '#D1FAE5', borderColor: '#10B981' },
  toggleAbsent: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  toggleText: { fontSize: 14, color: '#6B7280' },
  toggleTextActive: { fontSize: 14, color: '#111827', fontWeight: '600' },
  saveBtn: { marginTop: spacing[6] },
});
