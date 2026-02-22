/**
 * Communication: notices list. GET /api/communication/notices.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { communicationService } from '@/services/communication.service';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function CommunicationScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();

  const { data, isLoading } = useQuery({
    queryKey: ['communication', 'notices', schoolCode],
    queryFn: () => communicationService.getNotices(schoolCode, { limit: 50 }).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const notices = (data as { data?: unknown[] })?.data ?? (data as { notices?: unknown[] })?.notices ?? (Array.isArray(data) ? data : []);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Communication</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Notices" />
        {isLoading && !Array.isArray(notices)?.length ? (
          <ActivityIndicator size="small" color={INDIGO} style={styles.loader} />
        ) : Array.isArray(notices) && notices.length > 0 ? (
          (notices as { id?: string; title?: string; category?: string }[]).map((n, i) => (
            <View key={n.id ?? i} style={styles.card}>
              <Text style={styles.cardTitle}>{n.title ?? '—'}</Text>
              {n.category ? <Text style={styles.cardMeta}>{n.category}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No notices.</Text>
        )}
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
  loader: { marginVertical: spacing[4] },
  empty: { ...textStyles.bodySm, color: '#6B7280' },
  card: { backgroundColor: '#fff', padding: spacing[4], borderRadius: 8, marginBottom: spacing[3], borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { ...textStyles.body, color: '#111827', fontWeight: '600' },
  cardMeta: { ...textStyles.caption, color: '#6B7280', marginTop: 2 },
});
