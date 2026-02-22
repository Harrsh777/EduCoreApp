/**
 * EmptyState: icon/message when list or section is empty.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { textStyles } from '@/theme/typography';

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: React.ReactNode;
};

export function EmptyState({ title, message, icon }: EmptyStateProps) {
  const { colors: c, spacing } = useTheme();

  return (
    <View style={[styles.wrap, { padding: spacing[8] }]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={[textStyles.h4, { color: c.text.primary, textAlign: 'center', marginBottom: spacing[2] }]}>
        {title}
      </Text>
      {message ? (
        <Text style={[textStyles.bodySm, { color: c.text.secondary, textAlign: 'center' }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconWrap: { marginBottom: 16 },
});
