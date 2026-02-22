/**
 * Demo request service: fetch booked slots and submit demo requests via Supabase.
 * Table: demo_requests with columns: id, name, email, phone, demo_date, demo_time, created_at
 */

import { supabase } from '@/lib/supabase';

export type DemoSlot = { demo_date: string; demo_time: string };

export const demoService = {
  /** Fetch all booked slots from Supabase (demo_requests table) */
  async getBookedSlots(): Promise<DemoSlot[]> {
    const { data, error } = await supabase
      .from('demo_requests')
      .select('demo_date, demo_time');
    if (error) return [];
    return (data ?? []).map((row) => ({
      demo_date: String(row.demo_date ?? ''),
      demo_time: String(row.demo_time ?? '').trim(),
    }));
  },

  /** Insert a new demo request into Supabase */
  async submitDemoRequest(params: {
    name: string;
    email: string;
    phone: string;
    demo_date: string;
    demo_time: string;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    const { data, error } = await supabase.from('demo_requests').insert({
      name: params.name.trim(),
      email: params.email.trim(),
      phone: params.phone.trim(),
      demo_date: params.demo_date,
      demo_time: params.demo_time,
    }).select('id').single();

    if (error) {
      return { ok: false, error: error.message ?? 'Failed to schedule demo. Please try again.' };
    }
    return { ok: true };
  },
};
