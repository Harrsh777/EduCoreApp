/**
 * Student Management: directory GET /api/students?school_code=; detail GET /api/student/fees, /api/student/transport.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { schoolService } from '@/services/school.service';
import { studentService } from '@/services/student.service';
import { SearchBar } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

type StudentRow = Record<string, unknown>;

type NormalizedStudent = {
  id: string;
  displayName: string;
  admissionNo: string;
  className: string;
  section: string;
  rollNo: string;
  source: StudentRow;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function unwrapList(raw: unknown): StudentRow[] {
  if (Array.isArray(raw)) return raw as StudentRow[];
  const rec = asRecord(raw);
  if (Array.isArray(rec?.data)) return rec.data as StudentRow[];
  if (Array.isArray(rec?.students)) return rec.students as StudentRow[];
  return [];
}

function textValue(obj: Record<string, unknown> | null, keys: string[], fallback = '—'): string {
  if (!obj) return fallback;
  for (const key of keys) {
    const val = obj[key];
    if (val != null && String(val).trim()) return String(val).trim();
  }
  return fallback;
}

function toNormalizedStudent(raw: StudentRow): NormalizedStudent {
  const rec = asRecord(raw);
  const id = textValue(rec, ['id', 'student_id', 'studentId'], '');
  const displayName = textValue(rec, ['name', 'student_name', 'full_name', 'studentName'], '');
  const admissionNo = textValue(rec, ['admission_no', 'admissionNo', 'admission_number'], '');
  const className = textValue(rec, ['class', 'class_name', 'className', 'std'], '');
  const section = textValue(rec, ['section', 'sec', 'section_name'], '');
  const rollNo = textValue(rec, ['roll_number', 'roll_no', 'rollNo'], '');
  return {
    id: id || admissionNo || `${displayName}-${className}-${section}`.trim(),
    displayName: displayName || admissionNo || id || 'Student',
    admissionNo,
    className,
    section,
    rollNo,
    source: raw,
  };
}

function buildAttendanceSummary(raw: unknown) {
  const rec = asRecord(raw);
  const data = (rec?.data ?? raw) as unknown;
  const list = Array.isArray(data) ? data : Array.isArray(asRecord(data)?.attendance) ? (asRecord(data)?.attendance as unknown[]) : [];

  let present = 0;
  let absent = 0;
  let leave = 0;

  list.forEach((row) => {
    const status = textValue(asRecord(row), ['status', 'attendance_status'], '').toLowerCase();
    if (status.startsWith('p')) present += 1;
    else if (status.startsWith('a')) absent += 1;
    else if (status.startsWith('l')) leave += 1;
  });

  return { total: list.length, present, absent, leave };
}

export default function TeacherStudentsScreen() {
  const router = useRouter();
  const { schoolCode } = useTeacher();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [detailStudent, setDetailStudent] = useState<NormalizedStudent | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['students', 'directory', schoolCode],
    queryFn: () => schoolService.getStudents(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const normalized = useMemo(() => unwrapList(data).map(toNormalizedStudent), [data]);

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    normalized.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))];
  }, [normalized]);

  const sectionOptions = useMemo(() => {
    const set = new Set<string>();
    normalized.forEach((s) => {
      if (selectedClass !== 'ALL' && s.className !== selectedClass) return;
      if (s.section) set.add(s.section);
    });
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))];
  }, [normalized, selectedClass]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalized.filter((s) => {
      if (selectedClass !== 'ALL' && s.className !== selectedClass) return false;
      if (selectedSection !== 'ALL' && s.section !== selectedSection) return false;
      if (!q) return true;
      return (
        s.displayName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        `${s.className} ${s.section}`.toLowerCase().includes(q)
      );
    });
  }, [normalized, selectedClass, selectedSection, search]);

  const { data: feesRes, isLoading: feesLoading } = useQuery({
    queryKey: ['student', 'fees', schoolCode, detailStudent?.id],
    queryFn: () => studentService.getFees({ school_code: schoolCode, student_id: detailStudent!.id }),
    enabled: Boolean(schoolCode && detailStudent?.id),
  });

  const { data: attendanceRes, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student', 'attendance', schoolCode, detailStudent?.id],
    queryFn: () => studentService.getAttendance({ school_code: schoolCode, student_id: detailStudent!.id }),
    enabled: Boolean(schoolCode && detailStudent?.id),
  });

  const { data: transportRes, isLoading: transportLoading } = useQuery({
    queryKey: ['student', 'transport', schoolCode, detailStudent?.id],
    queryFn: () => studentService.getTransport({ school_code: schoolCode, student_id: detailStudent!.id }),
    enabled: Boolean(schoolCode && detailStudent?.id),
  });

  const { data: studentDetailRes, isLoading: detailLoading } = useQuery({
    queryKey: ['student', 'detail', schoolCode, detailStudent?.id],
    queryFn: () => studentService.getById(detailStudent!.id, schoolCode),
    enabled: Boolean(schoolCode && detailStudent?.id),
  });

  const detailRecord = useMemo(
    () => asRecord((studentDetailRes as { data?: unknown })?.data ?? studentDetailRes),
    [studentDetailRes]
  );
  const feeRecord = useMemo(() => asRecord((feesRes as { data?: unknown })?.data ?? feesRes), [feesRes]);
  const transportRecord = useMemo(
    () => asRecord((transportRes as { data?: unknown })?.data ?? transportRes),
    [transportRes]
  );
  const attendanceSummary = useMemo(() => buildAttendanceSummary(attendanceRes), [attendanceRes]);

  const renderItem = useCallback(
    ({ item }: { item: NormalizedStudent }) => (
      <Pressable style={styles.row} onPress={() => setDetailStudent(item)}>
        <View style={styles.rowMain}>
          <Text style={styles.rowName} numberOfLines={1}>
            {item.displayName}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {item.admissionNo || item.rollNo || item.id}
          </Text>
          <Text style={styles.rowClass}>
            {[item.className, item.section].filter(Boolean).join(' ') || '—'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    ),
    []
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Students</Text>
      </View>
      <View style={styles.toolbar}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, admission no, class..." />
        <Text style={styles.filterLabel}>Class</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroller}>
          {classOptions.map((c) => (
            <Pressable
              key={c}
              style={[styles.filterChip, selectedClass === c && styles.filterChipActive]}
              onPress={() => {
                setSelectedClass(c);
                setSelectedSection('ALL');
              }}
            >
              <Text style={[styles.filterChipText, selectedClass === c && styles.filterChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.filterLabel}>Section</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroller}>
          {sectionOptions.map((s) => (
            <Pressable
              key={s}
              style={[styles.filterChip, selectedSection === s && styles.filterChipActive]}
              onPress={() => setSelectedSection(s)}
            >
              <Text style={[styles.filterChipText, selectedSection === s && styles.filterChipTextActive]}>
                {s}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {isLoading && !list.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEACHER_GREEN} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          <Pressable onPress={() => refetch()}>
            <Text style={[styles.retry, { color: TEACHER_GREEN }]}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No students for selected filter/search.</Text>}
        />
      )}

      <Modal visible={detailStudent != null} transparent animationType="fade" onRequestClose={() => setDetailStudent(null)}>
        <View style={styles.modalWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDetailStudent(null)} />
          <View style={styles.modalCardOuter}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {detailStudent?.displayName ?? 'Student'}
              </Text>
              <Text style={styles.modalMeta}>
                {[detailStudent?.className, detailStudent?.section].filter(Boolean).join(' ') || '—'} ·{' '}
                {detailStudent?.admissionNo || detailStudent?.id}
              </Text>
              <ScrollView style={styles.modalScroll}>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoBlockTitle}>Personal Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Admission No</Text>
                      <Text style={styles.infoValue}>{detailStudent?.admissionNo || '—'}</Text>
                    </View>
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Class</Text>
                      <Text style={styles.infoValue}>
                        {[detailStudent?.className, detailStudent?.section].filter(Boolean).join(' ') || '—'}
                      </Text>
                    </View>
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Roll Number</Text>
                      <Text style={styles.infoValue}>{detailStudent?.rollNo || textValue(detailRecord, ['roll_no', 'roll_number'])}</Text>
                    </View>
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Date of Birth</Text>
                      <Text style={styles.infoValue}>{textValue(detailRecord, ['dob', 'date_of_birth'])}</Text>
                    </View>
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Parent Name</Text>
                      <Text style={styles.infoValue}>{textValue(detailRecord, ['parent_name', 'father_name', 'guardian_name'])}</Text>
                    </View>
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Phone</Text>
                      <Text style={styles.infoValue}>{textValue(detailRecord, ['phone', 'parent_phone', 'mobile'])}</Text>
                    </View>
                    <View style={[styles.infoCell, styles.infoCellWide]}>
                      <Text style={styles.infoLabel}>Address</Text>
                      <Text style={styles.infoValue}>{textValue(detailRecord, ['address', 'residential_address'])}</Text>
                    </View>
                  </View>
                  {detailLoading ? (
                    <ActivityIndicator color={TEACHER_GREEN} style={styles.detailLoader} />
                  ) : null}
                </View>

                <Text style={styles.detailHeading}>Attendance</Text>
                {attendanceLoading ? (
                  <ActivityIndicator color={TEACHER_GREEN} style={styles.detailLoader} />
                ) : (
                  <View style={styles.infoBlock}>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Total Days</Text>
                        <Text style={styles.infoValue}>{attendanceSummary.total}</Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Present</Text>
                        <Text style={styles.infoValue}>{attendanceSummary.present}</Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Absent</Text>
                        <Text style={styles.infoValue}>{attendanceSummary.absent}</Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Leave</Text>
                        <Text style={styles.infoValue}>{attendanceSummary.leave}</Text>
                      </View>
                    </View>
                  </View>
                )}
                <Text style={styles.detailHeading}>Fee Info</Text>
                {feesLoading ? (
                  <ActivityIndicator color={TEACHER_GREEN} style={styles.detailLoader} />
                ) : (
                  <View style={styles.infoBlock}>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Academic Year</Text>
                        <Text style={styles.infoValue}>
                          {textValue(feeRecord, ['academic_year', 'year', 'session'])}
                        </Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Fee Status</Text>
                        <Text style={styles.infoValue}>
                          {textValue(feeRecord, ['status', 'payment_status', 'fee_status'])}
                        </Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Total Fee</Text>
                        <Text style={styles.infoValue}>
                          {textValue(feeRecord, ['total_amount', 'total_fee', 'payable_amount'])}
                        </Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Due Amount</Text>
                        <Text style={styles.infoValue}>
                          {textValue(feeRecord, ['due_amount', 'pending_amount', 'remaining_amount'])}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                <Text style={styles.detailHeading}>Transport Info</Text>
                {transportLoading ? (
                  <ActivityIndicator color={TEACHER_GREEN} style={styles.detailLoader} />
                ) : (
                  <View style={styles.infoBlock}>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Route</Text>
                        <Text style={styles.infoValue}>
                          {textValue(transportRecord, ['route_name', 'route', 'transport_route'])}
                        </Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Stop</Text>
                        <Text style={styles.infoValue}>
                          {textValue(transportRecord, ['stop_name', 'stop', 'transport_stop'])}
                        </Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Vehicle</Text>
                        <Text style={styles.infoValue}>
                          {textValue(transportRecord, ['vehicle_no', 'vehicle_number', 'bus_no'])}
                        </Text>
                      </View>
                      <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Pickup Time</Text>
                        <Text style={styles.infoValue}>
                          {textValue(transportRecord, ['pickup_time', 'pick_time', 'time'])}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
              <Pressable style={styles.modalClose} onPress={() => setDetailStudent(null)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
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
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  toolbar: { padding: spacing[4], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: spacing[2] },
  filterLabel: { ...textStyles.caption, color: '#6B7280', marginTop: spacing[1] },
  chipScroller: { marginBottom: spacing[1] },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  filterChipText: { ...textStyles.bodySm, color: '#374151', fontWeight: '600' },
  filterChipTextActive: { color: '#166534' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...textStyles.body, color: '#B91C1C', marginBottom: spacing[2] },
  retry: { ...textStyles.button },
  listContent: { padding: spacing[4], paddingBottom: spacing[8] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rowMain: { flex: 1, marginRight: spacing[2] },
  rowName: { ...textStyles.body, fontWeight: '600', color: '#111827' },
  rowMeta: { ...textStyles.caption, color: '#6B7280', marginTop: 2 },
  rowClass: { ...textStyles.caption, color: '#374151', marginTop: 2, fontWeight: '600' },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  empty: { ...textStyles.body, color: '#6B7280' },
  modalWrap: { flex: 1, justifyContent: 'center' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCardOuter: { marginHorizontal: spacing[4] },
  modalCard: {
    maxHeight: '78%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalTitle: { ...textStyles.h4, color: '#111827' },
  modalMeta: { ...textStyles.caption, color: '#6B7280', marginBottom: spacing[3] },
  modalScroll: { maxHeight: 360 },
  infoBlock: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  infoBlockTitle: { ...textStyles.bodySm, color: '#374151', fontWeight: '700', marginBottom: spacing[2] },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  infoCell: { width: '48%' },
  infoCellWide: { width: '100%' },
  infoLabel: { ...textStyles.caption, color: '#6B7280' },
  infoValue: { ...textStyles.bodySm, color: '#111827', marginTop: 2, fontWeight: '600' },
  detailHeading: { ...textStyles.bodySm, fontWeight: '700', color: '#374151', marginTop: spacing[2] },
  detailLoader: { marginVertical: spacing[2] },
  modalClose: {
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  modalCloseText: { fontWeight: '600', color: TEACHER_GREEN },
});
