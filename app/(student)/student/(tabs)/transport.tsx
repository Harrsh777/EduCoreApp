import { SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { studentService } from '@/services/student.service';
import { transportService } from '@/services/transport.service';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StudentTransportScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id } = useSession();
  const student_id = user_id ?? '';

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'transport', school_code, student_id],
    queryFn: async () => {
      const res = await studentService.getTransport({ school_code: school_code!, student_id });
      return res.data;
    },
    enabled: Boolean(school_code && student_id),
  });

  const { data: routesData } = useQuery({
    queryKey: ['student', 'transport-routes', school_code],
    queryFn: async () => {
      const res = await transportService.getRoutes(school_code!);
      return res.data;
    },
    enabled: Boolean(school_code),
  });
  const { data: stopsData } = useQuery({
    queryKey: ['student', 'transport-stops', school_code],
    queryFn: async () => {
      const res = await transportService.getStops(school_code!);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const t = (data ?? {}) as Record<string, unknown>;
  const routes = Array.isArray(routesData) ? routesData : [];
  const stops = Array.isArray(stopsData) ? stopsData : [];
  const stopsByRouteId = stops.reduce<Record<string, typeof stops>>((acc, s) => {
    const rid = (s as { route_id?: string }).route_id;
    if (rid) {
      if (!acc[rid]) acc[rid] = [];
      acc[rid].push(s);
    }
    return acc;
  }, {});

  if (!school_code || !student_id) return null;
  if (isLoading && !data) return null;
  if (isError) {
    return (
      <View style={{ padding: spacing[4] }}>
        <SectionHeader title="Transport" />
        <Text style={{ color: c.error.main }}>{error?.message ?? 'Failed to load'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background.default }]}>
      <SectionHeader title="My transport" />
      <View
        style={[
          styles.sectionCard,
          {
            margin: spacing[4],
            borderColor: c.border.default,
            backgroundColor: c.surface.default,
          },
        ]}
      >
        <Text style={[styles.label, { color: c.text.secondary }]}>Route</Text>
        <Text style={[styles.value, { color: c.text.primary }]}>{String(t.route_name ?? t.route ?? '—')}</Text>
        <View style={[styles.rowDivider, { borderBottomColor: c.border.muted ?? c.border.default }]} />
        <Text style={[styles.label, { color: c.text.secondary }]}>Stop</Text>
        <Text style={[styles.value, { color: c.text.primary }]}>{String(t.stop_name ?? t.stop ?? '—')}</Text>
        <View style={[styles.rowDivider, { borderBottomColor: c.border.muted ?? c.border.default }]} />
        <Text style={[styles.label, { color: c.text.secondary }]}>Vehicle</Text>
        <Text style={[styles.value, { color: c.text.primary }]}>{String(t.vehicle_number ?? t.vehicle ?? '—')}</Text>
      </View>
      <SectionHeader title="Route maps" />
      <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[8] }}>
        {routes.map((r: { id: string; name?: string; vehicle_id?: string }) => {
          const routeStops = stopsByRouteId[r.id] ?? [];
          const sorted = [...routeStops].sort((a, b) => (Number((a as { order?: number }).order) || 0) - (Number((b as { order?: number }).order) || 0));
          return (
            <View
              key={r.id}
              style={[
                styles.sectionCard,
                {
                  marginBottom: spacing[2],
                  borderColor: c.border.default,
                  backgroundColor: c.surface.default,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: c.text.primary }]}>{r.name ?? r.id}</Text>
              <Text style={[styles.cardSubtitle, { color: c.text.secondary }]}>Vehicle ID: {r.vehicle_id ?? '—'}</Text>
              {sorted.length > 0 ? (
                <Text style={[styles.stopsLine, { color: c.text.secondary }]} numberOfLines={2}>
                  {sorted.map((s: { name?: string; id: string }) => s.name ?? s.id).join(' → ')}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  label: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  value: { fontSize: 17, fontWeight: '600', marginTop: 4 },
  rowDivider: {
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 13, marginTop: 4 },
  stopsLine: { fontSize: 12, marginTop: 8, lineHeight: 18 },
});
