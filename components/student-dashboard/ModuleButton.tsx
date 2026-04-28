/**
 * Module tile — rotating pastel icon circles (violet, pink, cyan, amber, emerald, rose).
 */

import { Pressable, Text, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getStudentModulePalette, studentDashboardTheme, studentDashboardCardStyle } from '@/theme/studentDashboard';
import { spacing } from '@/theme/spacing';

const { colors, cardRadiusLg, minTouchHeight } = studentDashboardTheme;
const MODULE_ICON_SIZE = 22;
const MODULE_ICON_CIRCLE_SIZE = 44;

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
        <Ionicons name={icon} size={MODULE_ICON_SIZE} color={iconColor} />
      </View>
      <Text style={styles.label} numberOfLines={2} ellipsizeMode="tail">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...studentDashboardCardStyle,
    width: '100%',
    minHeight: minTouchHeight + 36,
    height: minTouchHeight + 36,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: cardRadiusLg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.96,
  },
  iconCircle: {
    width: MODULE_ICON_CIRCLE_SIZE,
    height: MODULE_ICON_CIRCLE_SIZE,
    borderRadius: MODULE_ICON_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  label: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
