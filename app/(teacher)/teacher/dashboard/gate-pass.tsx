/**
 * Gate pass: GET front-office/dashboard, gate-pass, visitors.
 * Visible if view_gate_pass or manage_gate_pass. Same APIs/tables as admin.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { gatePassService } from '@/services/gate-pass.service';
import { SectionHeader, StatCard } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const G = '#16A34A';

export default function TeacherGatePassScreen() {
  const router = useRouter();
  const { schoolCode } = useTeacher();

  const { data: dashboardData } = useQuery({
    queryKey: ['front-office', 'dashboard', schoolCode],
    queryFn: () => gatePassService.getFrontOfficeDashboard(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: gatePassData } = useQuery({
    queryKey: ['gate-pass', schoolCode],
    queryFn: () => gatePassService.getGatePassList(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: visitorsData, isLoading } = useQuery({
    queryKey: ['visitors', schoolCode],
    queryFn: () => gatePassService.getVisitors(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const dashboard = (dashboardData ?? {}) as Record<string, unknown>;
  const gatePassList = (Array.isArray(gatePassData) ? gatePassData : (gatePassData as { data?: unknown[] })?.data ?? []) as { id?: string; visitor_name?: string; purpose?: string; status?: string }[];
  const visitors = (Array.isArray(visitorsData) ? visitorsData : (visitorsData as { data?: unknown[] })?.data ?? []) as { id?: string; name?: string; purpose?: string }[];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: G }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Gate pass</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Dashboard" />
        <View style={styles.grid}>
          <View style={styles.cardWrap}><StatCard label="Gate passes" value={gatePassList.length} variant="primary" /></View>
          <View style={styles.cardWrap}><StatCard label="Visitors" value={visitors.length} variant="success" /></View>
        </View>
        <SectionHeader title="Recent gate passes" />
        {gatePassList.length === 0 && !isLoading && <Text style={styles.hint}>No gate passes.</Text>}
        {gatePassList.slice(0, 10).map((g) => (
          <View key={g.id} style={styles.row}>
            <Text style={styles.rowText}>{g.visitor_name ?? '—'}</Text>
            <Text style={styles.rowMeta}>{g.purpose ?? ''}</Text>
            <Text style={[styles.badge, g.status === 'approved' && { color: G }]}>{g.status ?? '—'}</Text>
          </View>
        ))}
        <SectionHeader title="Visitors" />
        {visitors.slice(0, 10).map((v) => (
          <View key={v.id} style={styles.row}>
            <Text style={styles.rowText}>{v.name ?? '—'}</Text>
            <Text style={styles.rowMeta}>{v.purpose ?? ''}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', minHeight: 56 },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4], marginBottom: spacing[4] },
  cardWrap: { width: '47%', minWidth: 120 },
  row: { backgroundColor: '#fff', padding: spacing[3], borderRadius: 8, marginBottom: spacing[2], borderWidth: 1, borderColor: '#E5E7EB' },
  rowText: { ...textStyles.body, fontWeight: '600', color: '#111827' },
  rowMeta: { ...textStyles.bodySm, color: '#6B7280', marginTop: spacing[1] },
  badge: { ...textStyles.caption, fontWeight: '600', textTransform: 'capitalize', marginTop: spacing[1] },
  hint: { ...textStyles.body, color: '#6B7280' },
});
