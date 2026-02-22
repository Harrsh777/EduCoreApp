import { AppCard, DataList, SectionHeader } from '@/components/ui';
import { useSchool } from '@/hooks/useSchool';
import { useTheme } from '@/hooks/useTheme';
import { transportService } from '@/services/transport.service';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

type RouteStop = { id: string; name?: string; order?: number; [key: string]: unknown };
type Route = { id: string; name?: string; vehicle_id?: string; stops?: RouteStop[]; stop_ids?: string[]; [key: string]: unknown };
type Stop = { id: string; name?: string; address?: string; route_id?: string; [key: string]: unknown };
type Vehicle = { id: string; number?: string; capacity?: number; [key: string]: unknown };

export default function SchoolTransportScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();

  const { data: routesData, isLoading: routesLoading, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'transport-routes', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await transportService.getRoutes(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const { data: stopsData } = useQuery({
    queryKey: ['school', 'transport-stops', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await transportService.getStops(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['school', 'transport-vehicles', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await transportService.getVehicles(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const routes = Array.isArray(routesData) ? routesData : [];
  const stops = Array.isArray(stopsData) ? stopsData : [];
  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : [];

  const stopsByRouteId = stops.reduce<Record<string, Stop[]>>((acc, s) => {
    const rid = (s as Stop).route_id;
    if (rid) {
      if (!acc[rid]) acc[rid] = [];
      acc[rid].push(s);
    }
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <SectionHeader title="Transport" />
      <SectionHeader title="Route maps" />
      <DataList<Route>
        data={routes}
        loading={routesLoading}
        emptyTitle="No routes"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => {
          const routeStops = item.stops ?? stopsByRouteId[item.id] ?? [];
          const sorted = [...routeStops].sort((a, b) => (Number((a as RouteStop).order) || 0) - (Number((b as RouteStop).order) || 0));
          return (
            <AppCard style={{ marginBottom: spacing[3] }}>
              <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{item.name ?? item.id}</Text>
              <Text style={[styles.cardSubtitle, { color: c.text.secondary }]}>Vehicle ID: {item.vehicle_id ?? '—'}</Text>
              {sorted.length > 0 ? (
                <Text style={[styles.stopsLine, { color: c.text.secondary }]} numberOfLines={2}>
                  {sorted.map((s) => (s as RouteStop).name ?? s.id).join(' → ')}
                </Text>
              ) : null}
            </AppCard>
          );
        }}
      />
      <SectionHeader title="Stops" />
      <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}>
        {stops.slice(0, 10).map((s: Stop) => (
          <AppCard key={s.id} style={{ marginBottom: spacing[2] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]}>{s.name ?? s.id}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>{s.address ?? ''}</Text>
          </AppCard>
        ))}
      </View>
      <SectionHeader title="Vehicles" />
      <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[8] }}>
        {vehicles.slice(0, 10).map((v: Vehicle) => (
          <AppCard key={v.id} style={{ marginBottom: spacing[2] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]}>{v.number ?? v.id}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]}>Capacity: {v.capacity ?? '—'}</Text>
          </AppCard>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
  stopsLine: { fontSize: 12, marginTop: 6 },
});
