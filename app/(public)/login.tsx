import { PortalCard } from '@/components/login/PortalCard';
import { spacing } from '@/theme/spacing';
import { LinearGradient } from 'expo-linear-gradient';
import { Href } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  gradTop: '#F8FAFC',
  gradBottom: '#EEF2FF',
  surface: '#FFFFFF',
  primary: '#4F46E5',
  border: 'rgba(148, 163, 184, 0.35)',
  header: '#0F172A',
  muted: '#64748B',
} as const;

const CARD_GAP = spacing[5];
const SCREEN_PAD_X = spacing[6];

type PortalDef = {
  label: string;
  title: string;
  icon: 'school' | 'briefcase';
  iconTint: string;
  href: Href;
};

const PORTALS: readonly PortalDef[] = [
  {
    label: 'Student',
    title: 'Login as Student',
    icon: 'school',
    iconTint: COLORS.primary,
    href: '/student/login',
  },
  {
    label: 'Staff',
    title: 'Login as Staff',
    icon: 'briefcase',
    iconTint: COLORS.header,
    href: '/staff/login',
  },
];

export default function LoginHubScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const innerRowWidth = windowWidth - SCREEN_PAD_X * 2;
  const cardWidth = (innerRowWidth - CARD_GAP) / 2;
  const cardHeight = cardWidth;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[COLORS.gradTop, COLORS.gradBottom]} style={styles.gradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={styles.screen}>
            <View style={styles.header}>
              <Text style={styles.welcome}>Welcome Back</Text>
              <Text style={styles.subtitle}>Please select your portal</Text>
            </View>

            <View style={styles.centerBand}>
              <View style={styles.portalRow}>
                {PORTALS.map((p) => (
                  <PortalCard
                    key={p.label}
                    label={p.label}
                    title={p.title}
                    icon={p.icon}
                    iconTint={p.iconTint}
                    href={p.href}
                    width={cardWidth}
                    height={cardHeight}
                    borderColor={COLORS.border}
                    surfaceColor={COLORS.surface}
                    labelColor={COLORS.muted}
                    titleColor={COLORS.header}
                    iconCircleAlpha="14"
                  />
                ))}
              </View>
            </View>

            <View style={[styles.footer, { paddingBottom: Math.max(spacing[6], insets.bottom + spacing[4]) }]}>
              <Text style={styles.footerText}>
                Need assistance?{' '}
                <Text
                  accessibilityRole="link"
                  accessibilityLabel="Contact support"
                  onPress={() => {}}
                  style={styles.supportLink}
                >
                  Contact Support
                </Text>
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: SCREEN_PAD_X,
  },
  header: {
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  welcome: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.header,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: spacing[1.5],
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  centerBand: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '100%',
    gap: CARD_GAP,
  },
  footer: {
    paddingTop: spacing[4],
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  supportLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 20,
  },
});
