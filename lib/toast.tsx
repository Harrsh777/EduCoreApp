/**
 * Simple toast store and component for error/success messages.
 */

import { create } from 'zustand';
import { type ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { textStyles } from '@/theme/typography';

type ToastState = {
  message: string | null;
  type: 'error' | 'success' | 'info';
  show: (message: string, type?: 'error' | 'success' | 'info') => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'error',
  show: (message, type = 'error') => set({ message, type }),
  hide: () => set({ message: null }),
}));

const TOAST_DURATION = 4000;

export function ToastRoot() {
  const message = useToastStore((s) => s.message);
  const type = useToastStore((s) => s.type);
  const hide = useToastStore((s) => s.hide);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const useNative = Platform.OS !== 'web';

  useEffect(() => {
    if (!message) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: useNative }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: useNative }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: useNative }),
        Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: useNative }),
      ]).start(() => hide());
    }, TOAST_DURATION);
    return () => clearTimeout(t);
  }, [message, useNative]);

  if (!message) return null;

  const bg = type === 'error' ? colors.error.main : type === 'success' ? colors.success.main : colors.info.main;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.toast, { backgroundColor: bg }]}>
        <Text style={styles.text} numberOfLines={2}>{message}</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bg, opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: spacing[12] + 40,
    left: spacing[4],
    right: spacing[4],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.lg,
    zIndex: 9999,
    ...shadows.md,
  },
  text: {
    ...textStyles.bodySm,
    color: colors.neutral[0],
    textAlign: 'center',
  },
});
