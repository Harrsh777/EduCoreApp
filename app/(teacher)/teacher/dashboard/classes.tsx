/**
 * Classes (school-wide). GET /api/classes?school_code=; roster GET /api/students?class=&section=&academic_year=
 */

import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { schoolService } from '@/services/school.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

type ClassRow = {
  id?: string;
  class?: string;
  class_name?: string;
  name?: string;
  section?: string;
  academic_year?: string | number;
  student_count?: number;
  class_teacher_name?: string;
  class_teacher?: string;
};

function classRowKey(c: ClassRow): string {
  return String(c.id ?? `${c.class_name ?? c.class ?? ''}-${c.section ?? ''}-${c.academic_year ?? ''}`);
}

function rosterParams(c: ClassRow): { class: string; section?: string; academic_year?: string } {
  const cls = String(c.class_name ?? c.class ?? c.name ?? '').trim();
  const sec = c.section != null ? String(c.section).trim() : '';
  const ay = c.academic_year != null ? String(c.academic_year).trim() : '';
  return {
    class: cls,
    ...(sec ? { section: sec } : {}),
    ...(ay ? { academic_year: ay } : {}),
  };
}

export default function TeacherClassesScreen() {
  const router = useRouter();
  const { schoolCode, path } = useTeacher();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['school', 'classes', schoolCode],
    queryFn: () => schoolService.getClasses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const list = useMemo(() => {
    const raw = Array.isArray(data) ? data : (data as { data?: ClassRow[] })?.data ?? [];
    return raw as ClassRow[];
  }, [data]);

  const expanded = useMemo(
    () => (expandedKey ? list.find((c) => classRowKey(c) === expandedKey) ?? null : null),
    [list, expandedKey]
  );

  const { data: rosterData, isLoading: rosterLoading } = useQuery({
    queryKey: ['students', 'by-class', schoolCode, expandedKey],
    queryFn: () => {
      if (!expanded) throw new Error('No class');
      return schoolService.getStudents(schoolCode, rosterParams(expanded)).then((r) => r.data);
    },
    enabled: Boolean(schoolCode && expanded),
  });

  const roster = useMemo(() => {
    const raw = Array.isArray(rosterData) ? rosterData : (rosterData as { data?: unknown[] })?.data ?? [];
    return raw as Array<{ id?: string; name?: string; admission_no?: string }>;
  }, [rosterData]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Classes</Text>
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {list.map((c) => {
            const key = classRowKey(c);
            const label =
              [c.class_name ?? c.class ?? c.name, c.section].filter(Boolean).join('-') || c.id || 'Class';
            const teacherName = c.class_teacher_name ?? c.class_teacher;
            const open = expandedKey === key;
            return (
              <View key={key} style={styles.card}>
                <Pressable
                  style={styles.cardMain}
                  onPress={() => setExpandedKey(open ? null : key)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{label}</Text>
                    {teacherName ? (
                      <Text style={styles.cardSub} numberOfLines={1}>
                        Class teacher: {teacherName}
                      </Text>
                    ) : null}
                    {c.student_count != null ? (
                      <Text style={styles.cardMeta}>{c.student_count} students (from class record)</Text>
                    ) : null}
                  </View>
                  <Text style={styles.chevron}>{open ? '▾' : '›'}</Text>
                </Pressable>
                {open ? (
                  <View style={styles.roster}>
                    {rosterLoading ? (
                      <ActivityIndicator size="small" color={TEACHER_GREEN} style={styles.rosterLoader} />
                    ) : roster.length > 0 ? (
                      roster.slice(0, 20).map((s) => (
                        <Text key={s.id} style={styles.rosterRow} numberOfLines={1}>
                          {s.name ?? s.admission_no ?? s.id}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.rosterEmpty}>No students loaded for this class filter.</Text>
                    )}
                    {roster.length > 20 ? (
                      <Pressable onPress={() => router.push(path('students') as never)}>
                        <Text style={styles.linkAll}>Open Student Management</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
          {list.length === 0 && <Text style={styles.empty}>No classes in this school.</Text>}
        </ScrollView>
      )}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...textStyles.body, color: '#B91C1C', marginBottom: spacing[2] },
  retry: { ...textStyles.button },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: spacing[4] },
  cardTitle: { ...textStyles.body, fontWeight: '600', color: '#111827' },
  cardSub: { ...textStyles.caption, color: '#6B7280', marginTop: 4 },
  cardMeta: { ...textStyles.caption, color: '#9CA3AF', marginTop: 2 },
  chevron: { fontSize: 18, color: '#9CA3AF', marginLeft: spacing[2] },
  roster: { paddingHorizontal: spacing[4], paddingBottom: spacing[3], borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  rosterLoader: { marginVertical: spacing[2] },
  rosterRow: { ...textStyles.bodySm, color: '#374151', paddingVertical: 6 },
  rosterEmpty: { ...textStyles.caption, color: '#6B7280', paddingVertical: spacing[2] },
  linkAll: { ...textStyles.bodySm, color: TEACHER_GREEN, fontWeight: '600', marginTop: spacing[2] },
  empty: { ...textStyles.body, color: '#6B7280' },
});
