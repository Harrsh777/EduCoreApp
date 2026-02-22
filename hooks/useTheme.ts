/**
 * Theme hook: colors + spacing + radii + shadows for light/dark.
 * Use in components for dark/light support.
 */

import { useColorScheme } from 'react-native';
import { colors, darkColors } from '@/theme/colors';
import { spacing, radii, borderWidth } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { textStyles, fontSize } from '@/theme/typography';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = isDark ? darkColors : colors;
  return {
    colors: c,
    spacing,
    radii,
    borderWidth,
    shadows,
    textStyles,
    fontSize,
    isDark,
  };
}
