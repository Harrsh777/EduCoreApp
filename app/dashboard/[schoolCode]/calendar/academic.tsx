/**
 * Academic Calendar — spec path /calendar/academic.
 * View terms, session dates, key dates.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { calendarService } from '@/services/calendar.service';

const UI = { bg: '#F8FAFC', text: '#111827', muted: '#6B7280', primary: '#2563EB' };

export default function AcademicCalendarScreen() {
  const router = useRouter();
  const { schoolCode, path } = useSchoolCode();

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'academic', schoolCode],
    queryFn: () => calendarService.getCalendarAcademic(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const raw = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
  const list = raw as { name?: string; start_date?: string; end_date?: string }[];

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Academic Calendar</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={UI.primary} style={styles.loader} />
      ) : list.length === 0 ? (
        <Text style={styles.empty}>No academic calendar data. View main calendar for events.</Text>
      ) : (
        <View style={styles.list}>
          {list.map((item, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardTitle}>{item.name ?? 'Term'}</Text>
              <Text style={styles.cardMeta}>{item.start_date ?? ''} – {item.end_date ?? ''}</Text>
            </View>
          ))}
        </View>
      )}
      <Pressable style={styles.link} onPress={() => router.push(path('calendar') as never)}>
        <Text style={styles.linkText}>View full calendar →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  backBtn: { padding: 8, marginRight: 8 },
  backText: { fontSize: 16, color: UI.primary },
  title: { fontSize: 20, fontWeight: '700', color: UI.text },
  loader: { marginTop: 24 },
  empty: { fontSize: 14, color: UI.muted, padding: 16 },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: UI.text },
  cardMeta: { fontSize: 13, color: UI.muted, marginTop: 4 },
  link: { padding: 16 },
  linkText: { fontSize: 15, color: UI.primary, fontWeight: '600' },
});
