/**
 * Compact transport summary for student dashboard home tile (bus + stops + route).
 */

export type StudentTransportHomeSummary = {
  routeLabel: string;
  busLine: string;
  stopsLine: string;
  hasTransport: boolean;
};

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

/** Accepts GET /api/student/transport or Supabase-shaped payload. */
export function summarizeTransportForHome(raw: unknown): StudentTransportHomeSummary {
  const i = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const hasTransport =
    i.has_transport === true ||
    Boolean(i.route || i.route_name || (Array.isArray(i.stops) && i.stops.length > 0));

  if (!hasTransport) {
    return {
      routeLabel: 'No transport assigned',
      busLine: '',
      stopsLine: '',
      hasTransport: false,
    };
  }

  let routeLabel = 'Route';
  const r = i.route ?? i.route_name;
  if (typeof r === 'string' && r.trim()) routeLabel = r.trim();
  else if (r && typeof r === 'object' && str((r as { name?: string }).name))
    routeLabel = str((r as { name: string }).name);
  else if (str(i.route_name)) routeLabel = str(i.route_name);

  const v = i.vehicle;
  let busLine = '';
  if (typeof v === 'string' && v.trim()) busLine = v.trim();
  else if (v && typeof v === 'object') {
    const vo = v as Record<string, unknown>;
    const code = str(vo.vehicle_code ?? vo.bus_code ?? vo.code ?? vo.bus_number);
    const reg = str(vo.registration_number ?? vo.registration);
    const type = str(vo.type ?? vo.vehicle_type);
    // Home tile: one clear label (prefer bus code / number; omit redundant " · bus" style pairs).
    if (code) busLine = code;
    else if (reg) busLine = reg;
    else if (type) busLine = type;
  }
  if (!busLine && str(i.vehicle_number)) busLine = str(i.vehicle_number);

  const pickup = i.pickup_stop;
  let pickupName = '';
  if (typeof pickup === 'string') pickupName = pickup.trim();
  else if (pickup && typeof pickup === 'object') pickupName = str((pickup as { name?: string }).name);

  const drop = i.dropoff_stop;
  let dropPart = 'Drop-off not used';
  if (drop === null || drop === undefined || drop === '') dropPart = 'Drop-off not used';
  else if (typeof drop === 'string') dropPart = drop.trim() ? `Drop: ${drop.trim()}` : 'Drop-off not used';
  else if (drop && typeof drop === 'object') {
    const dn = str((drop as { name?: string }).name);
    dropPart = dn ? `Drop: ${dn}` : 'Drop-off not used';
  }

  const pickupPart = pickupName ? `Pickup: ${pickupName}` : 'Pickup: not assigned';
  const stopsLine = `${pickupPart} · ${dropPart}`;

  return {
    routeLabel,
    busLine,
    stopsLine,
    hasTransport: true,
  };
}
