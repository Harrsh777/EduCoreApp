/**
 * Gate Pass - Create and list gate passes. Spec path /gate-pass.
 */
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSchoolCode } from '@/lib/school-context';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function GatePassScreen() {
  const router = useRouter();
  const { schoolCode, path } = useSchoolCode();

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Gate Pass</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Gate pass" />
        <Text style={styles.hint}>New pass: person type, name, reason, date, time out, expected return. APIs: GET/POST /api/gate-pass.</Text>
        <Pressable style={styles.linkCard} onPress={() => router.push(path('front-office') as never)}>
          <Text style={styles.linkText}>Front office dashboard</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', minHeight: 56 },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  hint: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[4] },
  linkCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: spacing[4], borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  linkText: { ...textStyles.body, color: '#111827', flex: 1 },
  chevron: { fontSize: 20, color: '#9CA3AF', marginLeft: spacing[2] },
});
