/**
 * Transport from Supabase. Tables: transport_routes, transport_vehicles, transport_stops, transport_route_stops.
 */

import { supabase } from '@/lib/supabase';

export async function getRoutesFromSupabase(school_code: string) {
  const { data, error } = await supabase
    .from('transport_routes')
    .select('*')
    .eq('school_code', school_code.trim())
    .order('name');
  if (error) return { data: [] };
  return { data: data ?? [] };
}
