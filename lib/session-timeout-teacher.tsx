/**
 * Session timeout for Teacher: 20 min, modal at ≤2 min, redirect to /staff/login.
 */

import { useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useAuthStore } from '@/lib/auth-store';
import { authService } from '@/services/auth.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TWENTY_MIN_MS = 20 * 60 * 1000;
const TWO_MIN_MS = 2 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
const TEACHER_GREEN = '#16A34A';

type SessionTimeoutContextValue = { extendSession: () => void };
const SessionTimeoutContext = createContext<SessionTimeoutContextValue | null>(null);

export function useSessionTimeoutTeacher(): SessionTimeoutContextValue | null {
  return useContext(SessionTimeoutContext);
}

export function SessionTimeoutProviderTeacher({ children }: { children: ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [showModal, setShowModal] = useState(false);
  const [remainingMs, setRemainingMs] = useState(TWENTY_MIN_MS);
  const expiryRef = useRef(Date.now() + TWENTY_MIN_MS);

  const performLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    await logout();
    router.replace('/staff/login' as never);
  }, [logout, router]);

  const extendSession = useCallback(() => {
    expiryRef.current = Date.now() + TWO_MIN_MS;
    setShowModal(false);
    setRemainingMs(TWO_MIN_MS);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const remaining = expiryRef.current - now;
      if (remaining <= 0) {
        performLogout();
        return;
      }
      setRemainingMs(remaining);
      if (remaining > 0 && remaining < TWO_MIN_MS && !showModal) {
        setShowModal(true);
      }
    };
    tick();
    const id = setInterval(tick, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [performLogout, showModal]);

  const handleStay = useCallback(() => {
    expiryRef.current = Date.now() + TWO_MIN_MS;
    setShowModal(false);
    setRemainingMs(TWO_MIN_MS);
  }, []);

  const handleLogout = useCallback(() => {
    setShowModal(false);
    performLogout();
  }, [performLogout]);

  const minutesLeft = Math.max(0, Math.ceil(remainingMs / 60000));

  return (
    <SessionTimeoutContext.Provider value={{ extendSession }}>
      {children}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Session expiring</Text>
            <Text style={styles.message}>
              Your session will expire in {minutesLeft} min. Stay logged in?
            </Text>
            <View style={styles.actions}>
              <Pressable style={styles.btnSecondary} onPress={handleLogout}>
                <Text style={styles.btnSecondaryText}>Logout</Text>
              </Pressable>
              <Pressable style={[styles.btnPrimary, { backgroundColor: TEACHER_GREEN }]} onPress={handleStay}>
                <Text style={styles.btnPrimaryText}>Stay logged in</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SessionTimeoutContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing[6],
    minWidth: 280,
  },
  title: { ...textStyles.h4, color: '#111827', marginBottom: spacing[2] },
  message: { ...textStyles.body, color: '#6B7280', marginBottom: spacing[6] },
  actions: { flexDirection: 'row', gap: spacing[4], justifyContent: 'flex-end' },
  btnSecondary: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  btnSecondaryText: { ...textStyles.button, color: '#6B7280' },
  btnPrimary: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], borderRadius: 8 },
  btnPrimaryText: { ...textStyles.button, color: '#fff' },
});
