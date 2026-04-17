/**
 * Module tile — rotating pastel icon circles (violet, pink, cyan, amber, emerald, rose).
 */

import { Pressable, Text, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getStudentModulePalette, studentDashboardTheme, studentDashboardCardStyle } from '@/theme/studentDashboard';
import { spacing } from '@/theme/spacing';

const { colors, cardRadiusLg, minTouchHeight } = studentDashboardTheme;

type ModuleButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function ModuleButton({ icon, label, onPress }: ModuleButtonProps) {
  const { iconBg, icon: iconColor } = getStudentModulePalette(label);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...studentDashboardCardStyle,
    minHeight: minTouchHeight + 36,
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: cardRadiusLg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.96,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  label: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
