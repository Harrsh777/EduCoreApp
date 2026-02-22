/**
 * Card container using theme tokens.
 */

import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';

type CardProps = ViewProps & {
  padded?: boolean;
};

export function Card({ children, style, padded = true, ...rest }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  padded: { padding: spacing[4] },
});
