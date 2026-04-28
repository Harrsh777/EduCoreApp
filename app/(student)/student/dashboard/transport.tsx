/**
 * Transport Info: assigned route, vehicle, pickup/drop, ordered route stops.
 * Supabase (USE_SUPABASE_DASHBOARD): transport_routes, transport_route_stops, transport_stops, transport_vehicles.
 * REST: GET /api/student/transport?school_code=&student_id=
 */

import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStudent } from '@/lib/student-context';
import { env } from '@/lib/env';
import { getStudentByAdmissionNo } from '@/services/school.service';
import { studentService } from '@/services/student.service';
import { studentDashboardTheme } from '@/theme/studentDashboard';

const { colors, spacing: s, cardRadius, webSolid } = studentDashboardTheme;

type RouteInfo = string | { name?: string; description?: string; id?: string; is_active?: boolean };
type VehicleInfo =
  | string
  | {
      registration_number?: string;
      registration?: string;
      type?: string;
      vehicle_type?: string;
      capacity?: number;
      seats?: number;
      bus_number?: string;
      bus_code?: string;
      vehicle_code?: string;
      code?: string;
    };

type StopItem = {
  id?: string;
  stop_id?: string;
  name?: string;
  description?: string;
  subtitle?: string;
  fee?: number;
  pickup_fare?: number;
  drop_fare?: number;
  order?: number;
  stop_order?: number;
  fee_type?: string;
  [k: string]: unknown;
};

type TransportPayload = {
  has_transport?: boolean;
  transport_type?: string;
  route?: RouteInfo;
  vehicle?: VehicleInfo;
  stops?: StopItem[];
  pickup_stop?: string | StopItem;
  dropoff_stop?: string | StopItem | null;
  route_name?: string;
  route_is_active?: boolean;
  stop_name?: string;
  vehicle_number?: string;
  driver_name?: string;
  status?: string;
  [k: string]: unknown;
};

function formatInrAmount(value: unknown): string {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
  if (!Number.isFinite(n)) return '0';
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(2);
}

/** e.g. ₹100 / ₹199.99 or ₹0 when both equal */
function formatFarePair(pick: unknown, drop: unknown): string {
  const p = formatInrAmount(pick);
  const d = formatInrAmount(drop);
  if (p === d) return `₹${p}`;
  return `₹${p} / ₹${d}`;
}

function stopListLine(stop: StopItem): string {
  const label = String(stop.name ?? 'Stop');
  if (stop.pickup_fare != null || stop.drop_fare != null) {
    const fares = formatFarePair(stop.pickup_fare ?? 0, stop.drop_fare ?? stop.pickup_fare ?? 0);
    return `${label} (${fares})`;
  }
  if (stop.fee != null) return `${label} (₹${formatInrAmount(stop.fee)})`;
  return label;
}

function normalizeRoute(r: RouteInfo | undefined): { name: string; description: string; isActive: boolean } {
  if (r == null) return { name: '—', description: '', isActive: true };
  if (typeof r === 'string') return { name: r || '—', description: '', isActive: true };
  return {
    name: r.name ?? '—',
    description: r.description ?? '',
    isActive: r.is_active !== false,
  };
}

function normalizeVehicle(v: VehicleInfo | undefined): {
  vehicle_code: string;
  registration: string;
  type: string;
  seats: string;
} {
  if (v == null) return { vehicle_code: '—', registration: '—', type: '—', seats: '—' };
  if (typeof v === 'string') return { vehicle_code: '—', registration: v, type: '—', seats: '—' };
  const codeStr = String(v.vehicle_code ?? v.bus_code ?? v.code ?? v.bus_number ?? '').trim();
  const reg = String(v.registration_number ?? v.registration ?? '—');
  const type = String(v.vehicle_type ?? v.type ?? '—');
  const seatN = v.seats ?? v.capacity;
  const seats = seatN != null && String(seatN).trim() !== '' ? `${seatN} seats` : '—';
  return {
    vehicle_code: codeStr || '—',
    registration: reg || '—',
    type: type || '—',
    seats,
  };
}

function normalizeStops(stops: StopItem[] | undefined): StopItem[] {
  if (!Array.isArray(stops) || stops.length === 0) return [];
  const withOrder = stops.map((x) => ({
    ...x,
    _order: x.stop_order ?? x.order ?? 999,
  }));
  withOrder.sort((a, b) => (a._order as number) - (b._order as number));
  const seen = new Set<number>();
  return withOrder.filter((x) => {
    const o = Number(x._order) || 0;
    if (seen.has(o)) return false;
    seen.add(o);
    return true;
  });
}

function pickupLine(info: TransportPayload): string {
  const p = info.pickup_stop;
  if (p == null) return 'Pickup not assigned';
  if (typeof p === 'string') return p.trim() ? `${p.trim()} (₹0)` : 'Pickup not assigned';
  const name = String(p.name ?? 'Pickup not assigned').trim() || 'Pickup not assigned';
  const fare = (p as { pickup_fare?: number }).pickup_fare;
  return `${name} (₹${formatInrAmount(fare ?? 0)})`;
}

function dropoffLine(info: TransportPayload): { line: string; unused: boolean } {
  const d = info.dropoff_stop;
  if (d == null || d === '') return { line: 'Drop-off not used', unused: true };
  if (typeof d === 'string') {
    const t = d.trim();
    return t ? { line: `${t} (₹0)`, unused: false } : { line: 'Drop-off not used', unused: true };
  }
  const name = String(d.name ?? '—').trim() || '—';
  const fare = (d as { drop_fare?: number }).drop_fare;
  return { line: `${name} (₹${formatInrAmount(fare ?? 0)})`, unused: false };
}

export default function StudentTransportScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const canFetch = Boolean(schoolCode && (studentId || (env.USE_SUPABASE_DASHBOARD && student?.admission_no)));

  const { data: rawData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'transport', schoolCode, studentId, student?.admission_no],
    queryFn: async (): Promise<TransportPayload> => {
      let effectiveId = studentId;
      if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
        try {
          const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
          const row = (r as { data?: { id?: string } })?.data;
          if (row?.id) effectiveId = String(row.id);
        } catch {
          // keep studentId
        }
      }
      if (!effectiveId) return { has_transport: false };
      const r = await studentService.getTransport({ school_code: schoolCode, student_id: effectiveId });
      const api = (r as { data?: { data?: TransportPayload; has_transport?: boolean } }).data;
      const payload = api?.data ?? api ?? (r as unknown as TransportPayload);
      return (payload ?? { has_transport: false }) as TransportPayload;
    },
    enabled: canFetch,
  });

  const info: TransportPayload = rawData ?? {};
  const hasTransport =
    info.has_transport === true ||
    Boolean(info.route || info.route_name || (Array.isArray(info.stops) && info.stops.length > 0));

  const routeObj = normalizeRoute((info.route ?? info.route_name) as RouteInfo);
  const routeName = routeObj.name !== '—' ? routeObj.name : String(info.route_name ?? '—');
  const routeActive =
    typeof info.route_is_active === 'boolean' ? info.route_is_active : routeObj.isActive;
  const statusLabel =
    String(info.status ?? '').trim() ||
    (routeActive ? 'Active' : 'Inactive');
  const vehicle = normalizeVehicle(info.vehicle as VehicleInfo);
  const stops = normalizeStops(info.stops);
  const pickupText = pickupLine(info);
  const dropoff = dropoffLine(info);
  const transportTypeResolved =
    String(info.transport_type ?? '').trim() ||
    (vehicle.type !== '—' ? vehicle.type : '') ||
    '—';

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/student/dashboard');
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBackPress} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>Transport</Text>
        {hasTransport ? (
          <View style={[styles.statusPill, !routeActive && styles.statusPillInactive]}>
            <Text style={[styles.statusPillText, !routeActive && styles.statusPillTextInactive]}>{statusLabel}</Text>
          </View>
        ) : (
          <View style={styles.statusPillInactive}>
            <Text style={styles.statusPillTextInactive}>Not assigned</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : !hasTransport ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bus-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No transport assigned</Text>
            <Text style={styles.emptySubtitle}>Your transport details will appear here once assigned by the school.</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Transport Information</Text>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Route Name</Text>
                <Text style={styles.kvValue}>{routeName}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Transport Type</Text>
                <Text style={styles.kvValue}>{transportTypeResolved}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Status</Text>
                <Text style={styles.kvValue}>{statusLabel}</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Vehicle code</Text>
                <Text style={styles.kvValue}>{vehicle.vehicle_code}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Registration</Text>
                <Text style={styles.kvValue}>{vehicle.registration}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Type</Text>
                <Text style={styles.kvValue}>{vehicle.type}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Seats</Text>
                <Text style={styles.kvValue}>{vehicle.seats}</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Pickup Stop</Text>
              <Text style={styles.emphasisLine}>{pickupText}</Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Drop-off Stop</Text>
              {dropoff.unused ? (
                <Text style={styles.mutedLine}>Drop-off not used</Text>
              ) : (
                <Text style={styles.emphasisLine}>{dropoff.line}</Text>
              )}
            </View>

            {stops.length > 0 ? (
              <View style={styles.sectionCard}>
                <View style={styles.stopsHeaderInline}>
                  <Text style={styles.sectionTitle}>All Route Stops</Text>
                  <View style={styles.stopsCountBadge}>
                    <Text style={styles.stopsCountText}>{stops.length}</Text>
                  </View>
                </View>
                {stops.map((stop, index) => (
                  <View key={String(stop.stop_id ?? stop.id ?? index)} style={styles.stopRow}>
                    <Text style={styles.stopBullet}>{index + 1}.</Text>
                    <Text style={styles.stopLine}>{stopListLine(stop)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: 15,
    backgroundColor: colors.backgroundStart,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.lg,
    paddingVertical: s.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: webSolid.borderCard,
    minHeight: 56,
    gap: s.sm,
  },
  backBtn: { padding: s.sm, marginRight: s.xs },
  title: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  statusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: s.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  statusPillInactive: {
    backgroundColor: webSolid.borderSubtle,
    paddingHorizontal: s.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillTextInactive: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  scroll: { flex: 1 },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  loader: { marginVertical: s['2xl'] },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: cardRadius,
    padding: s['3xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: webSolid.borderCard,
  },
  emptyTitle: {
    color: colors.textPrimary,
    marginTop: s.lg,
    fontSize: 18,
    fontWeight: '500',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    marginTop: s.sm,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: cardRadius,
    padding: s.lg,
    marginBottom: s.lg,
    borderWidth: 1,
    borderColor: webSolid.borderCard,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: s.md,
    fontSize: 17,
    fontWeight: '500',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: s.md,
    marginBottom: s.sm,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: webSolid.borderSubtle,
  },
  kvLabel: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  kvValue: {
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '500',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  emphasisLine: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  mutedLine: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 15,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  stopsHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s.sm,
  },
  stopsCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: s.md,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  stopsCountText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: s.sm,
    borderBottomWidth: 1,
    borderBottomColor: webSolid.borderSubtle,
    gap: s.sm,
  },
  stopBullet: {
    width: 28,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  stopLine: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    minWidth: 0,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },

  bottomPad: { height: 80 },
});
