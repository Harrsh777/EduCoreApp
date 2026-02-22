/**
 * List row component using theme tokens.
 */

import { View, Text, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type ListItemProps = PressableProps & {
  title: string;
  subtitle?: string;
};

export function ListItem({ title, subtitle, ...rest }: ListItemProps) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} {...rest}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.surface.default,
  },
  pressed: { backgroundColor: colors.neutral[100] },
  content: { flex: 1 },
  title: { ...textStyles.body, color: colors.text.primary },
  subtitle: { ...textStyles.bodySm, color: colors.text.secondary, marginTop: spacing[0.5] },
});
