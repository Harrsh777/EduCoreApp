/**
 * FloatingActionButton: round FAB with press animation.
 */

import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { shadows } from '@/theme/shadows';

type FloatingActionButtonProps = {
  onPress: () => void;
  icon?: React.ReactNode;
  label?: string;
};

export function FloatingActionButton({ onPress, icon, label }: FloatingActionButtonProps) {
  const { colors: c, spacing, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: c.primary[600],
          borderRadius: radii.full,
          padding: spacing[4],
          opacity: pressed ? 0.9 : 1,
          ...shadows.lg,
        },
      ]}
    >
      {icon ?? (label ? <Text style={[styles.label, { color: c.text.inverse }]}>{label}</Text> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 16, bottom: 16 },
  label: { fontSize: 24, fontWeight: '600' },
});
