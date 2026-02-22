/**
 * PrimaryButton: green CTA, rounded-full. Teacher design system.
 */

import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';

const { colors, spacing: s } = teacherDashboardTheme;

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
};

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: PrimaryButtonProps) {
  const isOutline = variant === 'outline';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isOutline ? styles.btnOutline : styles.btnPrimary,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && !loading && { opacity: 0.9 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#FFFFFF'} size="small" />
      ) : (
        <Text style={[styles.label, isOutline ? styles.labelOutline : styles.labelPrimary]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: s.md,
    paddingHorizontal: s.xl,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary },
  btnDisabled: { opacity: 0.6 },
  label: { fontSize: 16, fontWeight: '600' },
  labelPrimary: { color: '#FFFFFF' },
  labelOutline: { color: colors.primary },
});
