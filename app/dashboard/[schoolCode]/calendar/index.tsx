/**
 * Event/Calendar: GET /api/calendar/academic, GET /api/calendar/events.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { calendarService } from '@/services/calendar.service';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function CalendarScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();

  const { data: academicData } = useQuery({
    queryKey: ['calendar', 'academic', schoolCode],
    queryFn: () => calendarService.getCalendarAcademic(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['calendar', 'events', schoolCode],
    queryFn: () => calendarService.getCalendarEvents(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const events = (eventsData as { events?: unknown[]; data?: unknown[] })?.events ?? (eventsData as { data?: unknown[] })?.data ?? [];
  const list = Array.isArray(events) ? events : [];

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Calendar</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Events" />
        {isLoading && list.length === 0 ? (
          <ActivityIndicator size="small" color={INDIGO} style={styles.loader} />
        ) : list.length === 0 ? (
          <Text style={styles.empty}>No events. Add events in the web app.</Text>
        ) : (
          list.map((e: { id?: string; title?: string; start?: string; end?: string }, i) => (
            <View key={e.id ?? i} style={styles.card}>
              <Text style={styles.cardTitle}>{e.title ?? 'Event'}</Text>
              <Text style={styles.cardMeta}>{e.start ?? ''} – {e.end ?? ''}</Text>
            </View>
          ))
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
  card: { backgroundColor: '#fff', padding: spacing[4], borderRadius: 12, marginBottom: spacing[3], borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { ...textStyles.body, color: '#111827', fontWeight: '600' },
  cardMeta: { ...textStyles.caption, color: '#6B7280', marginTop: 2 },
});
