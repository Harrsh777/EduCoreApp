/**
 * Reusable login form: role-based fields, API, and navigation.
 * Connects to exact APIs; stores session in SecureStore + Zustand; navigates to dashboard on success.
 */

import { Button } from '@/components/ui';
import type { InputThemeOverrides } from '@/components/ui/FloatingLabelInput';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import type { Profile } from '@/lib/auth-store';
import { useAuthStore, type Role } from '@/lib/auth-store';
import { env } from '@/lib/env';
import { useToastStore } from '@/lib/toast';
import { authService } from '@/services/auth.service';
import { supabaseTableAuthService } from '@/services/supabase-table-auth.service';
import type { AreaPalette } from '@/theme/areaPalettes';
import { spacing } from '@/theme/spacing';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function getDashboardPath(role: NonNullable<Role>, school_code?: string | null): string {
  if (role === 'admin' && school_code) return `/dashboard/${encodeURIComponent(school_code)}`;
  if (role === 'admin') return '/dashboard';
  if (role === 'teacher') return '/teacher/dashboard';
  if (role === 'student') return '/student/dashboard';
  if (role === 'accountant') return '/accountant';
  return '/login';
}

export type LoginFormRole = 'admin' | 'teacher' | 'student' | 'accountant';

export type RenderButtonArgs = { onPress: () => void; label: string; loading: boolean };

type LoginFormProps = {
  role: LoginFormRole;
  submitLabel?: string;
  palette?: AreaPalette;
  fontFamily?: string;
  buttonFontFamily?: string;
  renderButton?: (args: RenderButtonArgs) => ReactNode;
};

function getTokenFromResponse(data: unknown): string | undefined {
  const pick = (o: Record<string, unknown>): string | undefined => {
    const a =
      o.session_token ??
      o.token ??
      o.accessToken ??
      o.access_token ??
      o.jwt ??
      o.authToken ??
      o.auth_token ??
      o.sessionToken;
    return typeof a === 'string' && a.length > 0 ? a : undefined;
  };
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  const direct = pick(d);
  if (direct) return direct;
  const inner = d.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return pick(inner as Record<string, unknown>);
  }
  return undefined;
}

/** Flatten `{ data: { token, teacher } }` style bodies for profile/session fields */
function getSessionPayloadRecord(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};
  const d = data as Record<string, unknown>;
  const inner = d.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return { ...d, ...(inner as Record<string, unknown>) };
  }
  return d;
}

const ALLOWED_ROLES: LoginFormRole[] = ['admin', 'teacher', 'student', 'accountant'];

export function LoginForm({ role, submitLabel = 'Sign in', palette: areaPalette, fontFamily = undefined, buttonFontFamily = undefined, renderButton }: LoginFormProps) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const showToast = useToastStore((s) => s.show);
  const [email, setEmail] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [staffId, setStaffId] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const useSupabase = authService.useSupabaseAuth;
  // Use Supabase tables (accepted_schools, staff_login, student_login) when env says so and role is admin/teacher/student
  const useSupabaseTableAuth =
    env.USE_SUPABASE_TABLE_AUTH && useSupabase && (role === 'admin' || role === 'teacher' || role === 'student');

  const mutation = useMutation({
    mutationFn: async () => {
      if (useSupabaseTableAuth) {
        const code = schoolCode.trim();
        const pwd = password;
        let result: Awaited<ReturnType<typeof supabaseTableAuthService.studentLogin>> = null;
        try {
          if (role === 'admin') result = await supabaseTableAuthService.adminLogin(code, pwd);
          else if (role === 'teacher') result = await supabaseTableAuthService.staffLogin(code, staffId.trim(), pwd);
          else if (role === 'student') result = await supabaseTableAuthService.studentLogin(code, admissionNo.trim(), pwd);
          if (result == null && role === 'teacher') {
            // Fallback to backend teacher login for setups where staff_login stores hashed/alternate credentials.
            return authService.teacherLogin({ school_code: code, staff_id: staffId.trim(), password: pwd });
          }
          if (result == null) {
            const msg = role === 'student'
              ? 'No account found for this School code + Student ID, or wrong password. Check RLS if table exists.'
              : 'Invalid credentials.';
            if (__DEV__) console.error('[Login] Supabase table auth returned null:', { role, code, studentId: role === 'student' ? admissionNo.trim() : staffId.trim() });
            throw new Error(msg);
          }
          return result;
        } catch (e) {
          if (role === 'teacher') {
            try {
              return await authService.teacherLogin({ school_code: code, staff_id: staffId.trim(), password: pwd });
            } catch {
              // Preserve original table-auth error below when fallback also fails.
            }
          }
          if (__DEV__) console.error('[Login] Supabase table auth error:', e);
          throw e;
        }
      }
      if (useSupabase) return authService.supabaseSignIn(email.trim(), password);
      const body = { school_code: schoolCode.trim(), password };
      if (role === 'admin') return authService.adminLogin(body);
      if (role === 'teacher') return authService.teacherLogin({ ...body, staff_id: staffId.trim() });
      if (role === 'student') return authService.studentLogin({ ...body, admission_no: admissionNo.trim() });
      return authService.accountantLogin({ ...body, staff_id: staffId.trim() });
    },
    onSuccess: async (data) => {
      setInlineError(null);
      if (useSupabaseTableAuth) {
        const token = getTokenFromResponse(data);
        if (!data || typeof data !== 'object' || !token) {
          const msg = 'Invalid credentials or no account found.';
          setInlineError(msg);
          showToast(msg, 'error');
          if (__DEV__) console.warn('[Login] onSuccess with invalid data:', data);
          return;
        }
        const raw = data as Record<string, unknown>;
        const sessionTok =
          typeof raw.session_token === 'string' ? raw.session_token : token;
        const isTableOnlySession =
          typeof sessionTok === 'string' && sessionTok.startsWith('supabase-table-');

        if (isTableOnlySession) {
          const payload = data as {
            session_token: string;
            role: 'admin' | 'teacher' | 'student';
            school_code: string;
            user_id?: string;
            profile?: Profile | null;
          };
          await login({
            session_token: token,
            role: payload.role as NonNullable<Role>,
            school_code: payload.school_code,
            user_id: payload.user_id,
            profile: payload.profile ?? undefined,
          });
          router.replace(getDashboardPath(payload.role as NonNullable<Role>, payload.school_code) as never);
          return;
        }

        // API response after Supabase table miss (e.g. hashed passwords): same shape as non-table login
        const res = getSessionPayloadRecord(data);
        const roleFromData = (res?.role ?? role) as NonNullable<Role>;
        const roleKey = ALLOWED_ROLES.includes(roleFromData as LoginFormRole) ? roleFromData : role;
        const school_code = (res?.school_code as string | undefined) ?? schoolCode.trim();
        let user_id: string | undefined = typeof res?.user_id === 'string' ? res.user_id : undefined;
        let profile: Profile | undefined = res?.profile as Profile | undefined;

        if (role === 'admin' || roleKey === 'admin') {
          profile = res?.school as Profile | undefined;
        } else if (role === 'teacher' || roleKey === 'teacher') {
          const t = res?.teacher as Profile | undefined;
          user_id = typeof t?.id === 'string' ? t.id : undefined;
          profile = t ? { name: t.name as string | undefined, staff_id: t.staff_id as string | undefined, ...t } : undefined;
        } else if (role === 'student' || roleKey === 'student') {
          const s = res?.student as Profile | undefined;
          user_id = typeof s?.id === 'string' ? s.id : undefined;
          profile = s
            ? { name: s.name as string | undefined, admission_no: s.admission_no as string | undefined, ...s }
            : undefined;
        } else {
          profile = res?.accountant as Profile | undefined;
          user_id = typeof res?.user_id === 'string' ? res.user_id : undefined;
        }

        await login({
          session_token: token,
          role: roleKey as NonNullable<Role>,
          school_code,
          user_id,
          profile: profile ?? undefined,
        });
        router.replace(getDashboardPath(roleKey as NonNullable<Role>, school_code) as never);
        return;
      }
      const token = getTokenFromResponse(data);
      if (!token) {
        showToast('Invalid response from server', 'error');
        return;
      }
      const res = data as Record<string, unknown>;
      const roleFromData = (res?.role ?? role) as NonNullable<Role>;
      const roleKey = ALLOWED_ROLES.includes(roleFromData as LoginFormRole) ? roleFromData : role;
      const school_code = (res?.school_code as string | undefined) ?? schoolCode.trim();
      let user_id: string | undefined = typeof res?.user_id === 'string' ? res.user_id : undefined;
      let profile: Profile | undefined = res?.profile as Profile | undefined;

      if (!useSupabase && !useSupabaseTableAuth) {
        if (role === 'admin') {
          profile = res?.school as Profile | undefined;
        } else if (role === 'teacher') {
          const t = res?.teacher as Profile | undefined;
          user_id = typeof t?.id === 'string' ? t.id : undefined;
          profile = t ? { name: t.name, staff_id: t.staff_id, ...t } : undefined;
        } else if (role === 'student') {
          const s = res?.student as Profile | undefined;
          user_id = typeof s?.id === 'string' ? s.id : undefined;
          profile = s ? { name: s.name, admission_no: s.admission_no, ...s } : undefined;
        } else {
          profile = res?.accountant as Profile | undefined;
          user_id = typeof res?.user_id === 'string' ? res.user_id : undefined;
        }
      }

      await login({
        session_token: token,
        role: roleKey as NonNullable<Role>,
        school_code,
        user_id,
        profile: profile ?? undefined,
      });
      router.replace(getDashboardPath(roleKey as NonNullable<Role>, school_code) as never);
    },
    onError: (err: Error & { response?: { status?: number; data?: { message?: string } }; message?: string }) => {
      const isRls = err?.message?.includes('row-level security') || err?.message?.includes('permission');
      let msg: string;
      if (useSupabaseTableAuth) {
        msg = isRls
          ? 'Access denied. Add RLS policy for anon on student_login (see docs/supabase-rls-student-login.sql).'
          : (err?.message ?? 'Login failed. Check School code, Student ID and password.');
      } else {
        msg = err?.response?.status === 401
          ? 'Invalid credentials'
          : err?.response?.data?.message ?? err?.message ?? 'Login failed';
      }
      setInlineError(msg);
      showToast(msg, 'error');
      if (__DEV__) console.error('[Login] onError:', msg, err);
    },
  });

  const loading = mutation.isPending;
  const inputOverrides: InputThemeOverrides | undefined =
  areaPalette || fontFamily
    ? {
        ...(areaPalette
          ? {
              labelColor: areaPalette.textSecondary,
              inputColor: '#0f172a',          // 👈 solid text (important)
              placeholderColor: '#94a3b8',   // 👈 FIXED (no shadow)
              borderColor: areaPalette.border,
              focusColor: areaPalette.primary,
              backgroundColor:
                areaPalette.cardBg ?? areaPalette.background,
            }
          : {}),
        ...(fontFamily ? { fontFamily } : {}),
      }
    : undefined;
  const onSubmit = () => {
    setInlineError(null);
    if (useSupabaseTableAuth) {
      if (role === 'admin') {
        if (!schoolCode.trim() || !password) {
          const m = 'Enter school code and password';
          setInlineError(m);
          showToast(m, 'error');
          return;
        }
      } else if (role === 'student') {
        if (!schoolCode.trim() || !admissionNo.trim() || !password) {
          const m = 'Enter school code, Student ID and password';
          setInlineError(m);
          showToast(m, 'error');
          return;
        }
      } else {
        if (!schoolCode.trim() || !staffId.trim() || !password) {
          const m = 'Enter school code, staff ID and password';
          setInlineError(m);
          showToast(m, 'error');
          return;
        }
      }
      mutation.mutate();
      return;
    }
    if (useSupabase) {
      if (!email.trim() || !password) {
        showToast('Enter email and password', 'error');
        return;
      }
      mutation.mutate();
      return;
    }
    if (role === 'admin') {
      if (!schoolCode.trim() || !password) {
        showToast('Enter school code and password', 'error');
        return;
      }
    } else if (role === 'student') {
      if (!schoolCode.trim() || !admissionNo.trim() || !password) {
        showToast('Enter school code, admission number and password', 'error');
        return;
      }
    } else {
      if (!schoolCode.trim() || !staffId.trim() || !password) {
        showToast('Enter school code, staff ID and password', 'error');
        return;
      }
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {useSupabase && !useSupabaseTableAuth ? (
            <FloatingLabelInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              themeOverrides={inputOverrides}
            />
          ) : (
            <FloatingLabelInput
              label="School code"
              value={schoolCode}
              onChangeText={setSchoolCode}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
              themeOverrides={inputOverrides}
            />
          )}
          {(!useSupabase || useSupabaseTableAuth) && (role === 'teacher' || role === 'accountant') && (
            <FloatingLabelInput
              label="Staff ID"
              value={staffId}
              onChangeText={setStaffId}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
              themeOverrides={inputOverrides}
            />
          )}
          {(!useSupabase || useSupabaseTableAuth) && role === 'student' && (
            <FloatingLabelInput
              label="Student ID"
              value={admissionNo}
              onChangeText={setAdmissionNo}
              editable={!loading}
              themeOverrides={inputOverrides}
            />
          )}
          <FloatingLabelInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
            themeOverrides={inputOverrides}
            autoCapitalize="none"
            rightAccessory={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={12}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={inputOverrides?.labelColor ?? '#6B7280'}
                />
              </Pressable>
            }
          />
          {inlineError ? (
            <View style={styles.errorWrap}>
              <Text style={[styles.errorText, (fontFamily || buttonFontFamily) && { fontFamily: fontFamily || 'Playfair' }]} numberOfLines={3}>{inlineError}</Text>
            </View>
          ) : null}
          <View style={styles.submitWrap}>
            {renderButton ? (
              renderButton({ onPress: onSubmit, label: submitLabel, loading })
            ) : (
              <Button
                title={submitLabel}
                onPress={onSubmit}
                loading={loading}
                style={[
                  styles.submitBtn,
                  areaPalette?.primary && { backgroundColor: areaPalette.primary },
                ]}
                titleStyle={(buttonFontFamily || fontFamily) ? { fontFamily: buttonFontFamily || fontFamily } : undefined}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing[6], paddingBottom: spacing[12] },
  form: { maxWidth: 400, width: '100%', alignSelf: 'center' },
  errorWrap: { marginTop: spacing[2], marginBottom: spacing[2], paddingVertical: spacing[2], paddingHorizontal: spacing[3], backgroundColor: 'rgba(255,77,77,0.15)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,77,77,0.4)' },
  errorText: { fontSize: 14, color: '#FF4D4D', fontWeight: '500' },
  submitWrap: { marginTop: spacing[6] },
  submitBtn: { minHeight: 56 },
});
