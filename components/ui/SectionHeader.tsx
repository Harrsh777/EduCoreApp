/**
 * SectionHeader: title + optional action for list sections.
 */

import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { textStyles } from '@/theme/typography';

type SectionHeaderProps = ViewProps & {
  title: string;
  action?: React.ReactNode;
};

export function SectionHeader({ title, action, style, ...rest }: SectionHeaderProps) {
  const { colors: c, spacing } = useTheme();

  return (
    <View style={[styles.wrap, { marginBottom: spacing[2] }, style]} {...rest}>
      <Text style={[textStyles.h4, { color: c.text.primary }]} numberOfLines={1}>
        {title}
      </Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  action: {},
});
