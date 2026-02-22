/**
 * LoadingSkeleton: placeholder rows while data loads.
 */

import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type LoadingSkeletonProps = {
  rows?: number;
};

export function LoadingSkeleton({ rows = 5 }: LoadingSkeletonProps) {
  const { colors: c, spacing, radii } = useTheme();

  return (
    <View style={styles.wrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.row,
            {
              backgroundColor: c.surface.subdued,
              borderRadius: radii.lg,
              marginBottom: spacing[3],
              height: 72,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
});
