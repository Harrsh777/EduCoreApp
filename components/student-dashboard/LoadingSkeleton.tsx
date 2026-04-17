/**
 * Loading placeholders — pastel blocks matching home tile hues.
 */

import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import {
  STUDENT_HOME_TILES,
  STUDENT_MODULE_PALETTES,
  studentDashboardTheme,
} from '@/theme/studentDashboard';

const { colors, spacing: s } = studentDashboardTheme;
const isWeb = Platform.OS === 'web';

const TILE_BGS = STUDENT_HOME_TILES.map((t) => t.bg);

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
    outputRange: [0.45, 0.85],
  });

  return (
    <View style={styles.wrap}>
      {isWeb ? (
        <View style={styles.homeGrid}>
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: TILE_BGS[0] }]} />
            <View style={[styles.statCard, { backgroundColor: TILE_BGS[1] }]} />
          </View>
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: TILE_BGS[2] }]} />
            <View style={[styles.statCard, { backgroundColor: TILE_BGS[3] }]} />
          </View>
        </View>
      ) : (
        <Animated.View style={[styles.homeGrid, { opacity }]}>
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: TILE_BGS[0] }]} />
            <View style={[styles.statCard, { backgroundColor: TILE_BGS[1] }]} />
          </View>
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: TILE_BGS[2] }]} />
            <View style={[styles.statCard, { backgroundColor: TILE_BGS[3] }]} />
          </View>
        </Animated.View>
      )}
      {isWeb ? (
        <View style={styles.section}>
          <View style={[styles.sectionTitle, { backgroundColor: colors.primaryLight }]} />
          <View style={styles.sectionGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.moduleBtn,
                  { backgroundColor: STUDENT_MODULE_PALETTES[i % STUDENT_MODULE_PALETTES.length].iconBg },
                ]}
              />
            ))}
          </View>
        </View>
      ) : (
        <Animated.View style={[styles.section, { opacity }]}>
          <View style={[styles.sectionTitle, { backgroundColor: colors.primaryLight }]} />
          <View style={styles.sectionGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.moduleBtn,
                  { backgroundColor: STUDENT_MODULE_PALETTES[i % STUDENT_MODULE_PALETTES.length].iconBg },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: s.xl, paddingTop: s.sm },
  homeGrid: { marginBottom: s['2xl'] },
  statRow: {
    flexDirection: 'row',
    gap: s.lg,
    marginBottom: s.lg,
  },
  statCard: {
    flex: 1,
    height: 168,
    borderRadius: studentDashboardTheme.cardRadius,
    borderWidth: 1.5,
    borderColor: 'rgba(109, 40, 217, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  section: { marginBottom: s['2xl'] },
  sectionTitle: {
    height: 22,
    width: 160,
    borderRadius: 8,
    marginBottom: s.lg,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.lg,
  },
  moduleBtn: {
    width: '47%',
    height: 96,
    borderRadius: studentDashboardTheme.cardRadiusLg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
