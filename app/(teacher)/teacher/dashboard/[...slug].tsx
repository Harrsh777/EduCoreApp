/**
 * Teacher dashboard module placeholder: any path under /teacher/dashboard/* (e.g. attendance, marks).
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTeacherOrNull } from '@/lib/teacher-context';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

export default function TeacherModulePlaceholderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string[] }>();
  const slug = params.slug ?? [];
  const pathLabel = slug.map((s) => s.replace(/-/g, ' ')).join(' / ') || 'Module';
  const teacher = useTeacherOrNull();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {pathLabel}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{pathLabel}</Text>
        {teacher?.school_code ? (
          <Text style={styles.hint}>School: {teacher.school_code}</Text>
        ) : null}
        <Text style={styles.hint}>Module screen. Connect API and add full UI here.</Text>
      </View>
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
  content: { flex: 1, padding: spacing[6], justifyContent: 'center' },
  label: { ...textStyles.h2, color: '#111827', marginBottom: spacing[4] },
  hint: { ...textStyles.bodySm, color: '#6B7280', marginTop: spacing[2] },
});
