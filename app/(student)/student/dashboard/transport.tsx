/**
 * Transport Info: assigned route, vehicle details, route stops timeline.
 * API: GET /api/student/transport?school_code=&student_id=
 * Response: { data: { has_transport, transport_type, route, vehicle, stops, pickup_stop, dropoff_stop } }
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
import { textStyles } from '@/theme/typography';

const { colors, spacing: s, cardRadius, webSolid } = studentDashboardTheme;

// Normalized types from API (supports both object and string shapes)
type RouteInfo = string | { name?: string; description?: string; id?: string };
type VehicleInfo =
  | string
  | {
      registration_number?: string;
      registration?: string;
      type?: string;
      vehicle_type?: string;
      capacity?: number;
      bus_number?: string;
      bus_code?: string;
    };
type StopItem = {
  id?: string;
  name?: string;
  description?: string;
  subtitle?: string;
  fee?: number;
  fee_type?: string;
  order?: number;
  [k: string]: unknown;
};
type TransportPayload = {
  has_transport?: boolean;
  transport_type?: string;
  route?: RouteInfo;
  vehicle?: VehicleInfo;
  stops?: StopItem[];
  pickup_stop?: string | StopItem;
  dropoff_stop?: string | StopItem;
  route_name?: string;
  stop_name?: string;
  vehicle_number?: string;
  driver_name?: string;
  status?: string;
  [k: string]: unknown;
};

function normalizeRoute(r: RouteInfo | undefined): { name: string; description: string } {
  if (r == null) return { name: '—', description: '' };
  if (typeof r === 'string') return { name: r || '—', description: '' };
  return {
    name: r.name ?? '—',
    description: r.description ?? '',
  };
}

function normalizeVehicle(v: VehicleInfo | undefined): {
  registration: string;
  type: string;
  capacity: string;
  busLabel: string;
} {
  if (v == null) return { registration: '—', type: '—', capacity: '—', busLabel: 'Bus' };
  if (typeof v === 'string') return { registration: v, type: '—', capacity: '—', busLabel: 'Bus' };
  const reg = v.registration_number ?? v.registration ?? '—';
  const type = v.vehicle_type ?? v.type ?? '—';
  const cap = v.capacity != null ? String(v.capacity) : '—';
  const busNum = v.bus_number ?? v.bus_code ?? '';
  return {
    registration: reg,
    type,
    capacity: cap,
    busLabel: busNum ? `Bus ${busNum}` : 'Bus',
  };
}

function normalizeStops(stops: StopItem[] | undefined, pickupId?: string, dropoffId?: string): StopItem[] {
  if (!Array.isArray(stops) || stops.length === 0) return [];
  const withOrder = stops
    .map((x) => ({ ...x, _order: x.order ?? 999 }))
    .sort((a, b) => (a._order as number) - (b._order as number));
  return withOrder.map((x) => ({
    ...x,
    fee_type: x.fee_type ?? (x.id === pickupId ? 'PICKUP' : x.id === dropoffId ? 'DROPOFF' : undefined),
  }));
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
  const hasTransport = info.has_transport === true || Boolean(info.route || info.route_name || (Array.isArray(info.stops) && info.stops.length > 0));
  const route = normalizeRoute((info.route ?? info.route_name) as RouteInfo);
  const vehicle = normalizeVehicle(info.vehicle as VehicleInfo);
  const pickupId = typeof info.pickup_stop === 'object' && info.pickup_stop?.id != null ? String(info.pickup_stop.id) : typeof info.pickup_stop === 'string' ? info.pickup_stop : undefined;
  const dropoffId = typeof info.dropoff_stop === 'object' && info.dropoff_stop?.id != null ? String(info.dropoff_stop.id) : typeof info.dropoff_stop === 'string' ? info.dropoff_stop : undefined;
  const stops = normalizeStops(info.stops, pickupId, dropoffId);
  const statusLabel = (info.status as string) ?? 'Active';
  const statusPill = `${vehicle.busLabel} • ${statusLabel}`;

  const handleViewMap = () => {
    // Placeholder: could open maps with route or school address
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>Transport</Text>
        {hasTransport ? (
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{statusPill}</Text>
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
            {/* Main route card */}
            <View style={styles.routeCard}>
              <View style={styles.routeCardTop}>
                <View style={styles.assignedBadge}>
                  <Text style={styles.assignedBadgeText}>ASSIGNED</Text>
                </View>
                <View style={styles.busIconWrap}>
                  <Ionicons name="bus" size={28} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.routeName}>{route.name}</Text>
              {route.description ? (
                <Text style={styles.routeSubtitle}>{route.description}</Text>
              ) : (
                <Text style={styles.routeSubtitle}>Dedicated School Bus Service</Text>
              )}
              <Pressable style={styles.viewMapBtn} onPress={handleViewMap}>
                <Ionicons name="map" size={20} color="#fff" />
                <Text style={styles.viewMapBtnText}>View Map</Text>
              </Pressable>
            </View>

            {/* Vehicle details: 3 cards */}
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleCardIcon}>
                  <Ionicons name="document-text" size={22} color={colors.primary} />
                </View>
                <Text style={styles.vehicleCardLabel}>REGISTRATION</Text>
                <Text style={styles.vehicleCardValue}>{vehicle.registration}</Text>
              </View>
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleCardIcon}>
                  <Ionicons name="car" size={22} color={colors.primary} />
                </View>
                <Text style={styles.vehicleCardLabel}>VEHICLE TYPE</Text>
                <Text style={styles.vehicleCardValue}>{vehicle.type}</Text>
              </View>
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleCardIcon}>
                  <Ionicons name="people" size={22} color={colors.primary} />
                </View>
                <Text style={styles.vehicleCardLabel}>CAPACITY</Text>
                <Text style={styles.vehicleCardValue}>{vehicle.capacity}</Text>
              </View>
            </View>

            {/* Route stops */}
            {stops.length > 0 && (
              <View style={styles.stopsSection}>
                <View style={styles.stopsHeader}>
                  <Text style={styles.stopsTitle}>All Route Stops</Text>
                  <View style={styles.stopsCountBadge}>
                    <Text style={styles.stopsCountText}>{stops.length} Stops Total</Text>
                  </View>
                </View>
                <View style={styles.timeline}>
                  {stops.map((stop, index) => {
                    const isFirst = index === 0;
                    const isLast = index === stops.length - 1;
                    const fee = stop.fee != null ? `₹${stop.fee} /mo` : null;
                    const feeType = stop.fee_type ? `${stop.fee_type.replace('_', ' ')} FEE` : null;
                    const isCampus = /campus|school|destination/i.test(String(stop.name ?? ''));
                    return (
                      <View key={stop.id ?? index} style={styles.timelineRow}>
                        <View style={styles.timelineLeft}>
                          {isCampus && isLast ? (
                            <View style={styles.timelineDotCampus}>
                              <Ionicons name="school" size={18} color={colors.success} />
                            </View>
                          ) : (
                            <>
                              <View style={[styles.timelineDot, isFirst && styles.timelineDotActive]} />
                              {!isLast && <View style={styles.timelineLine} />}
                            </>
                          )}
                        </View>
                        <View style={styles.timelineBody}>
                          <Text style={styles.stopName}>{stop.name ?? 'Stop'}</Text>
                          {(stop.description ?? stop.subtitle) && (
                            <Text style={styles.stopDesc}>{stop.description ?? stop.subtitle}</Text>
                          )}
                        </View>
                        <View style={styles.timelineRight}>
                          {fee != null && <Text style={styles.stopFee}>{fee}</Text>}
                          {feeType != null && <Text style={styles.stopFeeType}>{feeType}</Text>}
                        </View>
                      </View>
                    );
                  })}
                  {/* Final destination with graduation cap if last stop is not already campus */}
                  {!stops.some((stop) => /campus|school|destination/i.test(String(stop.name ?? ''))) && (
                    <View style={styles.timelineRow}>
                      <View style={styles.timelineLeft}>
                        <View style={styles.timelineDotCampus}>
                          <Ionicons name="school" size={18} color={colors.success} />
                        </View>
                      </View>
                      <View style={styles.timelineBody}>
                        <Text style={styles.stopName}>EduCore Campus</Text>
                        <Text style={styles.stopDesc}>School destination</Text>
                      </View>
                      <View style={styles.timelineRight} />
                    </View>
                  )}
                </View>
              </View>
            )}
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
  title: { ...textStyles.h4, color: colors.textPrimary, flex: 1 },
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
  emptyTitle: { ...textStyles.h4, color: colors.textPrimary, marginTop: s.lg },
  emptySubtitle: { ...textStyles.body, color: colors.textSecondary, marginTop: s.sm, textAlign: 'center' },

  routeCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: cardRadius,
    padding: s.xl,
    marginBottom: s.lg,
    borderWidth: 1,
    borderColor: webSolid.borderSubtle,
  },
  routeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s.md,
  },
  assignedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: s.md,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assignedBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  busIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  routeName: { ...textStyles.h4, color: colors.textPrimary, marginBottom: 4 },
  routeSubtitle: { ...textStyles.caption, color: colors.textSecondary, marginBottom: s.lg },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: s.md,
    borderRadius: 12,
    gap: s.sm,
  },
  viewMapBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  vehicleRow: {
    flexDirection: 'row',
    gap: s.md,
    marginBottom: s['2xl'],
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: s.lg,
    borderWidth: 1,
    borderColor: webSolid.borderCard,
  },
  vehicleCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.sm,
  },
  vehicleCardLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  vehicleCardValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

  stopsSection: { marginBottom: s['2xl'] },
  stopsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s.lg,
  },
  stopsTitle: { ...textStyles.h4, color: colors.textPrimary },
  stopsCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: s.md,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stopsCountText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  timeline: {},
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  timelineLeft: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: webSolid.borderSubtle,
    backgroundColor: colors.surface,
  },
  timelineDotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  timelineDotCampus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: 18,
    left: 6,
    width: 2,
    bottom: -12,
    backgroundColor: webSolid.borderSubtle,
  },
  timelineBody: { flex: 1, minWidth: 0, paddingLeft: s.md, paddingBottom: s.lg },
  stopName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  stopDesc: { ...textStyles.caption, color: colors.textSecondary, marginTop: 2 },
  timelineRight: { alignItems: 'flex-end', paddingLeft: s.sm, paddingBottom: s.lg },
  stopFee: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  stopFeeType: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 2 },

  bottomPad: { height: 80 },
});
