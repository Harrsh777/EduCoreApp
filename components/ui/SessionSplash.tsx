/**
 * Full-screen loading splash while session is being restored.
 */

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export function SessionSplash() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.app,
    gap: spacing[4],
  },
  text: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
});
