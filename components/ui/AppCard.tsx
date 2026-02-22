/**
 * AppCard: rounded corners, soft shadow, press animation.
 * Reusable card for lists and content.
 */

import { View, Pressable, StyleSheet, Platform, type ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type AppCardProps = ViewProps & {
  padded?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
};

export function AppCard({ children, style, padded = true, onPress, ...rest }: AppCardProps) {
  const { colors: c, spacing, radii, shadows } = useTheme();

  const containerStyle = [
    styles.card,
    {
      backgroundColor: c.surface.default,
      borderRadius: radii.xl,
      padding: padded ? spacing[4] : 0,
      ...shadows.md,
      borderWidth: 1,
      borderColor: c.border.default,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          ...containerStyle,
          pressed && (Platform.OS === 'web' ? { backgroundColor: c.surface.subtle ?? c.surface.default } : { opacity: 0.92 }),
        ]}
        onPress={onPress}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle} {...rest}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {},
});
