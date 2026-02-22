/**
 * Front Office: dashboard, gate pass, visitors. GET/POST /api/front-office, gate-pass, visitors.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSchoolCode } from '@/lib/school-context';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function FrontOfficeScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Front Office</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Gate pass & visitors" />
        <Text style={styles.hint}>Dashboard, gate pass form and visitor list. Use the web app for full front office flows.</Text>
      </ScrollView>
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
    minHeight: 56,
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  hint: { ...textStyles.bodySm, color: '#6B7280' },
});
