/**
 * Transport from Supabase. Tables: transport_routes, transport_vehicles, transport_stops, transport_route_stops.
 */

import { supabase } from '@/lib/supabase';

const code = (school_code: string) => school_code.trim();

function coerceId(v: unknown): string | null {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  return s || null;
}

function assignmentFromStudentRow(row: Record<string, unknown>): {
  routeId: string | null;
  pickupStopId: string | null;
  dropStopId: string | null;
} {
  const routeId = coerceId(
    row.transport_route_id ?? row.route_id ?? row.transport_route ?? row.bus_route_id
  );
  const pickupStopId = coerceId(
    row.pickup_stop_id ??
      row.transport_pickup_stop_id ??
      row.boarding_point_id ??
      row.boarding_stop_id
  );
  const dropRaw =
    row.dropoff_stop_id ?? row.drop_stop_id ?? row.transport_drop_stop_id ?? row.deboarding_stop_id;
  const dropStopId = dropRaw == null || dropRaw === '' ? null : coerceId(dropRaw);
  return { routeId, pickupStopId, dropStopId };
}

/** Optional mapping table used by some schools (Student Route Mapping). */
async function tryJunctionAssignment(studentId: string): Promise<{
  routeId: string;
  pickupStopId: string | null;
  dropStopId: string | null;
} | null> {
  const tables = ['transport_route_students', 'transport_students'] as const;
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').eq('student_id', studentId).maybeSingle();
    if (error || !data) continue;
    const r = data as Record<string, unknown>;
    const routeRaw = r.route_id ?? r.transport_route_id;
    if (!routeRaw) continue;
    const dropR = r.dropoff_stop_id ?? r.drop_stop_id;
    return {
      routeId: String(routeRaw),
      pickupStopId: coerceId(r.pickup_stop_id ?? r.boarding_stop_id),
      dropStopId: dropR == null || dropR === '' ? null : coerceId(dropR),
    };
  }
  return null;
}

function dedupeByStopOrder<T extends { stop_order?: unknown; id?: unknown }>(rows: T[]): T[] {
  const sorted = [...rows].sort((a, b) => {
    const oa = Number(a.stop_order) || 0;
    const ob = Number(b.stop_order) || 0;
    if (oa !== ob) return oa - ob;
    return String(a.id ?? '').localeCompare(String(b.id ?? ''));
  });
  const seen = new Set<number>();
  const out: T[] = [];
  for (const r of sorted) {
    const o = Number(r.stop_order) || 0;
    if (seen.has(o)) continue;
    seen.add(o);
    out.push(r);
  }
  return out;
}

export type StudentTransportPayload = {
  has_transport: boolean;
  transport_type?: string;
  route?: { id?: string; name?: string; is_active?: boolean; description?: string };
  route_name?: string;
  route_is_active?: boolean;
  status?: string;
  vehicle?: {
    vehicle_code?: string;
    registration_number?: string;
    type?: string;
    seats?: number;
    bus_number?: string;
    capacity?: number;
  };
  stops?: Array<{
    id?: string;
    stop_id?: string;
    name?: string;
    stop_order?: number;
    pickup_fare?: number;
    drop_fare?: number;
    order?: number;
    fee?: number;
  }>;
  pickup_stop?: string | { id?: string; name?: string; pickup_fare?: number };
  dropoff_stop?: string | { id?: string; name?: string; drop_fare?: number } | null;
};

/**
 * Resolve assigned route + vehicle + stops using:
 * students.transport_route_id (and common aliases) + pickup/drop stop ids, or transport_route_students.
 * Joins: routes → vehicles; route_stops → stops. Active rows only; route stops ordered by stop_order (unique per order).
 */
export async function getStudentTransportFromSupabase(
  school_code: string,
  student_id: string
): Promise<StudentTransportPayload> {
  const sc = code(school_code);
  const sid = String(student_id ?? '').trim();
  if (!sc || !sid) return { has_transport: false };

  const { data: studentRow, error: studentErr } = await supabase
    .from('students')
    .select('*')
    .eq('id', sid)
    .eq('school_code', sc)
    .maybeSingle();

  if (studentErr || !studentRow) return { has_transport: false };

  let { routeId, pickupStopId, dropStopId } = assignmentFromStudentRow(studentRow as Record<string, unknown>);

  if (!routeId) {
    const fromJunction = await tryJunctionAssignment(sid);
    if (fromJunction) {
      routeId = fromJunction.routeId;
      pickupStopId = pickupStopId ?? fromJunction.pickupStopId;
      dropStopId = dropStopId ?? fromJunction.dropStopId;
    }
  }

  if (!routeId) return { has_transport: false };

  const { data: route, error: routeErr } = await supabase
    .from('transport_routes')
    .select('*')
    .eq('id', routeId)
    .eq('school_code', sc)
    .eq('is_active', true)
    .maybeSingle();

  if (routeErr || !route) return { has_transport: false };

  const routeRecord = route as Record<string, unknown>;
  const vehicleFk = routeRecord.vehicle_id;

  let vehicleRecord: Record<string, unknown> | null = null;
  if (vehicleFk != null && String(vehicleFk).trim()) {
    const { data: v } = await supabase
      .from('transport_vehicles')
      .select('*')
      .eq('id', vehicleFk)
      .eq('is_active', true)
      .maybeSingle();
    vehicleRecord = (v as Record<string, unknown> | null) ?? null;
  }

  const { data: routeStopsRaw } = await supabase
    .from('transport_route_stops')
    .select('id, stop_id, stop_order, pickup_fare, drop_fare')
    .eq('route_id', routeId)
    .eq('is_active', true)
    .order('stop_order', { ascending: true });

  const routeStops = dedupeByStopOrder(routeStopsRaw ?? []);

  const stopIdsFromRoute = routeStops
    .map((r) => String((r as { stop_id?: string }).stop_id ?? ''))
    .filter(Boolean);
  const extra = [pickupStopId, dropStopId].filter((x): x is string => Boolean(x));
  const allStopIds = [...new Set([...stopIdsFromRoute, ...extra])];

  let stopNameById = new Map<string, string>();
  if (allStopIds.length > 0) {
    const { data: stopsData } = await supabase
      .from('transport_stops')
      .select('id, name')
      .in('id', allStopIds)
      .eq('is_active', true);
    stopNameById = new Map(
      (stopsData ?? []).map((s) => {
        const row = s as { id: string; name?: string };
        return [String(row.id), String(row.name ?? '')];
      })
    );
  }

  const findRouteStopRow = (stopId: string | null) => {
    if (!stopId) return undefined;
    return routeStops.find((r) => String((r as { stop_id?: string }).stop_id) === stopId) as
      | { pickup_fare?: number; drop_fare?: number }
      | undefined;
  };

  const stops = routeStops
    .map((rs) => {
      const row = rs as {
        id?: string;
        stop_id?: string;
        stop_order?: number | string;
        pickup_fare?: number | string | null;
        drop_fare?: number | string | null;
      };
      const stopId = String(row.stop_id ?? '');
      if (!stopId) return null;
      const nm = stopNameById.get(stopId);
      if (nm === undefined) return null;
      const pick = row.pickup_fare != null && row.pickup_fare !== '' ? Number(row.pickup_fare) : 0;
      const drop = row.drop_fare != null && row.drop_fare !== '' ? Number(row.drop_fare) : 0;
      const ord = row.stop_order != null ? Number(row.stop_order) : undefined;
      return {
        id: stopId,
        stop_id: stopId,
        name: nm || 'Stop',
        stop_order: ord,
        pickup_fare: pick,
        drop_fare: drop,
        order: ord,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const pickupRow = findRouteStopRow(pickupStopId);
  const pickupFare = pickupRow?.pickup_fare != null ? Number(pickupRow.pickup_fare) : 0;
  const pickupName = pickupStopId ? stopNameById.get(pickupStopId) : undefined;
  const pickup_stop =
    pickupStopId != null
      ? {
          id: pickupStopId,
          name: pickupName && pickupName.trim() ? pickupName : 'Pickup not assigned',
          pickup_fare: pickupFare,
        }
      : undefined;

  let dropoff_stop: StudentTransportPayload['dropoff_stop'] = null;
  if (dropStopId) {
    const dropRow = findRouteStopRow(dropStopId);
    const dropFare = dropRow?.drop_fare != null ? Number(dropRow.drop_fare) : 0;
    const dropName = stopNameById.get(dropStopId);
    dropoff_stop = {
      id: dropStopId,
      name: dropName && dropName.trim() ? dropName : 'Stop',
      drop_fare: dropFare,
    };
  }

  const v = vehicleRecord;
  const vehicle =
    v != null
      ? {
          vehicle_code: String(v.vehicle_code ?? v.code ?? v.bus_code ?? ''),
          registration_number: String(v.registration_number ?? v.registration ?? ''),
          type: String(v.type ?? v.vehicle_type ?? ''),
          seats:
            v.seats != null
              ? Number(v.seats)
              : v.capacity != null
                ? Number(v.capacity)
                : v.seat_capacity != null
                  ? Number(v.seat_capacity)
                  : undefined,
          bus_number: v.bus_number != null ? String(v.bus_number) : undefined,
          capacity: v.capacity != null ? Number(v.capacity) : undefined,
        }
      : undefined;

  const routeName = String(routeRecord.name ?? 'Route');
  const routeActive = routeRecord.is_active !== false;

  return {
    has_transport: true,
    transport_type: vehicle?.type || undefined,
    route: {
      id: String(routeRecord.id ?? routeId),
      name: routeName,
      is_active: routeActive,
    },
    route_name: routeName,
    route_is_active: routeActive,
    status: routeActive ? 'Active' : 'Inactive',
    vehicle,
    stops,
    pickup_stop,
    dropoff_stop: dropStopId ? dropoff_stop : null,
  };
}

export async function getRoutesFromSupabase(school_code: string) {
  const { data, error } = await supabase
    .from('transport_routes')
    .select('*')
    .eq('school_code', code(school_code))
    .order('name');
  if (error) return { data: [] };
  return { data: data ?? [] };
}
