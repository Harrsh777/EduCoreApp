/**
 * Shimmer loading placeholders for student dashboard (cards and sections).
 * On web: no Animated.View / opacity (avoids alpha compositing and text blur).
 */

import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { spacing } from '@/theme/spacing';

const { colors, cardRadius } = studentDashboardTheme;
const isWeb = Platform.OS === 'web';

export function LoadingSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isWeb) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, useNativeDriver: true, duration: 800 }),
        Animated.timing(shimmer, { toValue: 0, useNativeDriver: true, duration: 800 }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.wrap}>
      {isWeb ? (
        <View style={styles.statRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.statCard} />
          ))}
        </View>
      ) : (
        <Animated.View style={[styles.statRow, { opacity }]}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.statCard} />
          ))}
        </Animated.View>
      )}
      {isWeb ? (
        <View style={styles.section}>
          <View style={styles.sectionTitle} />
          <View style={styles.sectionGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.moduleBtn} />
            ))}
          </View>
        </View>
      ) : (
        <Animated.View style={[styles.section, { opacity }]}>
          <View style={styles.sectionTitle} />
          <View style={styles.sectionGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.moduleBtn} />
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  statRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  statCard: {
    flex: 1,
    height: 88,
    borderRadius: cardRadius,
    backgroundColor: colors.cardBg,
  },
  section: { marginBottom: spacing[5] },
  sectionTitle: {
    height: 22,
    width: 160,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    marginBottom: spacing[4],
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  moduleBtn: {
    width: '47%',
    height: 96,
    borderRadius: cardRadius,
    backgroundColor: colors.cardBg,
  },
});
