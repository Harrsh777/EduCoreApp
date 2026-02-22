/**
 * Transport: vehicles, stops, routes. GET /api/transport/vehicles, stops, routes, students.
 * Visible if view_transport or manage_transport. Same APIs/tables as admin.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { transportService } from '@/services/transport.service';
import { SectionHeader, StatCard } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const G = '#16A34A';

export default function TeacherTransportScreen() {
  const router = useRouter();
  const { schoolCode } = useTeacher();

  const { data: vehiclesData } = useQuery({
    queryKey: ['transport', 'vehicles', schoolCode],
    queryFn: () => transportService.getVehicles(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: stopsData } = useQuery({
    queryKey: ['transport', 'stops', schoolCode],
    queryFn: () => transportService.getStops(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: routesData, isLoading } = useQuery({
    queryKey: ['transport', 'routes', schoolCode],
    queryFn: () => transportService.getRoutes(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const vehicles = (Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData as { data?: unknown[] })?.data ?? []) as { id?: string; name?: string }[];
  const stops = (Array.isArray(stopsData) ? stopsData : (stopsData as { data?: unknown[] })?.data ?? []) as { id?: string; name?: string }[];
  const routes = (Array.isArray(routesData) ? routesData : (routesData as { data?: unknown[] })?.data ?? []) as { id?: string; name?: string }[];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: G }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Transport</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Overview" />
        <View style={styles.grid}>
          <View style={styles.cardWrap}><StatCard label="Vehicles" value={vehicles.length} variant="primary" /></View>
          <View style={styles.cardWrap}><StatCard label="Stops" value={stops.length} variant="success" /></View>
          <View style={styles.cardWrap}><StatCard label="Routes" value={routes.length} variant="neutral" /></View>
        </View>
        <SectionHeader title="Routes" />
        {routes.slice(0, 15).map((r) => (
          <View key={r.id} style={styles.row}><Text style={styles.rowText}>{r.name ?? r.id ?? '—'}</Text></View>
        ))}
        {routes.length === 0 && !isLoading && <Text style={styles.hint}>No routes.</Text>}
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
  cardWrap: { width: '30%', minWidth: 100 },
  row: { backgroundColor: '#fff', padding: spacing[3], borderRadius: 8, marginBottom: spacing[2], borderWidth: 1, borderColor: '#E5E7EB' },
  rowText: { ...textStyles.body, color: '#111827' },
  hint: { ...textStyles.body, color: '#6B7280' },
});
