/**
 * My School tab: institute info summary or quick stats.
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSchoolCode } from '@/lib/school-context';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export default function MySchoolScreen() {
  const { schoolCode, schoolName } = useSchoolCode();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My School</Text>
      <View style={styles.card}>
        <Text style={styles.label}>School code</Text>
        <Text style={styles.value}>{schoolCode}</Text>
      </View>
      {schoolName ? (
        <View style={styles.card}>
          <Text style={styles.label}>School name</Text>
          <Text style={styles.value}>{schoolName}</Text>
        </View>
      ) : null}
      <Text style={styles.hint}>Institute info and quick stats can be loaded from API here.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  title: { ...textStyles.h2, color: '#111827', marginBottom: spacing[6] },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: spacing[4], marginBottom: spacing[4], borderWidth: 1, borderColor: '#E5E7EB' },
  label: { ...textStyles.caption, color: '#6B7280', marginBottom: 4 },
  value: { ...textStyles.body, color: '#111827' },
  hint: { ...textStyles.caption, color: '#9CA3AF', marginTop: spacing[4] },
});
