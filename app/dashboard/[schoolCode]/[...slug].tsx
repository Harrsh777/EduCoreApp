/**
 * Catch-all for module paths: /dashboard/:schoolCode/institute-info, settings/roles, etc.
 * Placeholder screen; full module screens can be added later.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSchoolCodeOrNull } from '@/lib/school-context';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export default function ModulePlaceholderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string[] }>();
  const slug = params.slug ?? [];
  const pathLabel = slug.join(' / ') || 'Module';
  const school = useSchoolCodeOrNull();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{pathLabel}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{pathLabel}</Text>
        {school && <Text style={styles.hint}>School: {school.schoolCode}</Text>}
        <Text style={styles.hint}>Module screen placeholder. Connect API and add full UI here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: spacing[2], marginRight: spacing[2] },
  backText: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  content: { flex: 1, padding: spacing[6], justifyContent: 'center' },
  label: { ...textStyles.h2, color: '#111827', marginBottom: spacing[4] },
  hint: { ...textStyles.bodySm, color: '#6B7280', marginTop: spacing[2] },
});
