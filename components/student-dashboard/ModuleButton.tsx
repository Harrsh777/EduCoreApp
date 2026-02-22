/**
 * Rounded module button: circular icon + plain text label (no typography spread).
 */

import { Pressable, Text, StyleSheet, View, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { spacing } from '@/theme/spacing';

const { colors, cardRadius, cardRadiusLg, minTouchHeight, webSolid } = studentDashboardTheme;

type ModuleButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function ModuleButton({ icon, label, onPress }: ModuleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={24} color={colors.highlight} />
      </View>
      <Text style={[styles.label, Platform.OS === 'web' && styles.labelWeb]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: minTouchHeight + 36,
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: cardRadiusLg ?? 24,
    backgroundColor: webSolid.accentPressed,
    borderWidth: 1,
    borderColor: webSolid.borderCard,
  },
  pressed: {
    backgroundColor: webSolid.accentMuted,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  label: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  labelWeb: Platform.OS === 'web'
    ? {
        // @ts-expect-error - web-only, crisp text
        WebkitFontSmoothing: 'antialiased',
        // @ts-expect-error - web-only
        MozOsxFontSmoothing: 'grayscale',
      }
    : {},
});
