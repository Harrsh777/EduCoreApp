/**
 * My School tab: Institute Info or short summary.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTeacher } from '@/lib/teacher-context';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

export default function MySchoolScreen() {
  const router = useRouter();
  const { teacher, path } = useTeacher();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My School</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Institute" />
        <Pressable style={styles.card} onPress={() => router.push(path('institute-info') as never)}>
          <Text style={styles.cardTitle}>Institute Info</Text>
          <Text style={styles.cardMeta}>View school details</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { ...textStyles.body, color: '#111827', fontWeight: '600', flex: 1 },
  cardMeta: { ...textStyles.caption, color: '#6B7280', marginRight: spacing[2] },
  chevron: { fontSize: 20, color: '#9CA3AF' },
});
