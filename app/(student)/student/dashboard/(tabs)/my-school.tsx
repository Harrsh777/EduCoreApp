/**
 * My School tab: institute summary or link to Parent Info / Communication.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useStudent } from '@/lib/student-context';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const STUDENT_BLUE = '#2563EB';

export default function StudentMySchoolScreen() {
  const router = useRouter();
  const { student, path } = useStudent();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My School</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Quick links" />
        <Pressable style={styles.card} onPress={() => router.push(path('parent') as never)}>
          <Text style={styles.cardTitle}>Parent Info</Text>
          <Text style={styles.cardMeta}>View parent details</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.card} onPress={() => router.push(path('communication') as never)}>
          <Text style={styles.cardTitle}>Communication</Text>
          <Text style={styles.cardMeta}>Notices and updates</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F9FF' },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 56,
  },
  title: { ...textStyles.h4, color: '#111827' },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing[4],
    borderRadius: 12,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { ...textStyles.body, color: '#111827', fontWeight: '600', flex: 1 },
  cardMeta: { ...textStyles.caption, color: '#6B7280', marginRight: spacing[2] },
  chevron: { fontSize: 20, color: '#9CA3AF' },
});
