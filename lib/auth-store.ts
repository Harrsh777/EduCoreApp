/**
 * Zustand auth store for School ERP mobile app.
 * Session stored in SecureStore on native; AsyncStorage on web (SecureStore is not available on web).
 */

import { create } from 'zustand';
import { Platform } from 'react-native';

/** SecureStore on native; AsyncStorage on web (SecureStore.setItemAsync is not a function on web) */
const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return AsyncStorage.getItem(key);
    }
    const SecureStore = require('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
      return;
    }
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(key);
      return;
    }
    const SecureStore = require('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  },
};

const SESSION_TOKEN_KEY = 'educore_session_token';
const SESSION_ROLE_KEY = 'educore_session_role';
const SESSION_SCHOOL_KEY = 'educore_school_code';
const SESSION_USER_ID_KEY = 'educore_user_id';
const SESSION_PROFILE_KEY = 'educore_profile';

export type Role = 'admin' | 'teacher' | 'student' | 'accountant' | null;

export type Profile = Record<string, unknown> & {
  name?: string;
  school_code?: string;
  staff_id?: string;
  admission_no?: string;
  class?: string;
  section?: string;
};

export type SessionPayload = {
  role: Role;
  school_code?: string | null;
  user_id?: string | null;
  profile?: Profile | null;
};

type AuthState = {
  role: Role;
  school_code: string | null;
  user_id: string | null;
  profile: Profile | null;
  session_token: string | null;
  hydrated: boolean;
  /** True after hydrate + session check (GET /api/auth/session) has completed */
  sessionRestored: boolean;
};

type AuthActions = {
  setSession: (params: {
    session_token: string;
    role: Role;
    school_code?: string | null;
    user_id?: string | null;
    profile?: Profile | null;
  }) => Promise<void>;
  /** Restore state from GET /api/auth/session response (token already in store from hydrate) */
  restoreFromSession: (payload: SessionPayload) => void;
  login: (params: {
    session_token: string;
    role: Role;
    school_code?: string | null;
    user_id?: string | null;
    profile?: Profile | null;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setSessionRestored: (value: boolean) => void;
  setProfile: (profile: Profile | null) => void;
};

const initialState: AuthState = {
  role: null,
  school_code: null,
  user_id: null,
  profile: null,
  session_token: null,
  hydrated: false,
  sessionRestored: false,
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  ...initialState,

  setSession: async (params) => {
    const { session_token, role, school_code, user_id, profile } = params;
    await sessionStorage.setItem(SESSION_TOKEN_KEY, session_token);
    await sessionStorage.setItem(SESSION_ROLE_KEY, role ?? '');
    await sessionStorage.setItem(SESSION_SCHOOL_KEY, school_code ?? '');
    await sessionStorage.setItem(SESSION_USER_ID_KEY, user_id ?? '');
    await sessionStorage.setItem(
      SESSION_PROFILE_KEY,
      profile ? JSON.stringify(profile) : ''
    );
    set({
      session_token,
      role,
      school_code: school_code ?? null,
      user_id: user_id ?? null,
      profile: profile ?? null,
    });
  },

  restoreFromSession: (payload) => {
    const { role, school_code, user_id, profile } = payload;
    set({
      role: role ?? null,
      school_code: school_code ?? null,
      user_id: user_id ?? null,
      profile: profile ?? null,
    });
  },

  login: async (params) => {
    await get().setSession(params);
  },

  logout: async () => {
    await sessionStorage.removeItem(SESSION_TOKEN_KEY);
    await sessionStorage.removeItem(SESSION_ROLE_KEY);
    await sessionStorage.removeItem(SESSION_SCHOOL_KEY);
    await sessionStorage.removeItem(SESSION_USER_ID_KEY);
    await sessionStorage.removeItem(SESSION_PROFILE_KEY);
    set(initialState);
  },

  hydrate: async () => {
    try {
      const [token, role, schoolCode, userId, profileJson] = await Promise.all([
        sessionStorage.getItem(SESSION_TOKEN_KEY),
        sessionStorage.getItem(SESSION_ROLE_KEY),
        sessionStorage.getItem(SESSION_SCHOOL_KEY),
        sessionStorage.getItem(SESSION_USER_ID_KEY),
        sessionStorage.getItem(SESSION_PROFILE_KEY),
      ]);
      const roleVal = (role || null) as Role;
      const profile: Profile | null = profileJson
        ? (JSON.parse(profileJson) as Profile)
        : null;
      set({
        session_token: token ?? null,
        role: roleVal && roleVal.length ? roleVal : null,
        school_code: schoolCode && schoolCode.length ? schoolCode : null,
        user_id: userId && userId.length ? userId : null,
        profile,
        hydrated: true,
      });
    } catch {
      set({ ...initialState, hydrated: true });
    }
  },

  setSessionRestored: (value) => {
    set({ sessionRestored: value });
  },

  setProfile: (profile) => {
    set({ profile });
    if (profile) {
      sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
    }
  },
}));
