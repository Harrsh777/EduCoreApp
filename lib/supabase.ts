/**
 * Supabase JS client for School ERP mobile app.
 * When URL + anon key are set, auth uses Supabase (no custom backend cert issues).
 * Session persisted via AsyncStorage so auth survives app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { env } from './env';

const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

export const useSupabaseAuth = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type SupabaseClient = typeof supabase;
