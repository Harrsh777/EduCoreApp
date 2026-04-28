import { PortalCard } from '@/components/login/PortalCard';
import { spacing } from '@/theme/spacing';
import { LinearGradient } from 'expo-linear-gradient';
import { Href } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const COLORS = {
  gradTop: '#F8FAFC',
  gradBottom: '#EEF2FF',
  surface: '#FFFFFF',
  primary: '#4F46E5',
  secondary: '#7C3AED',
  accent: '#06B6D4',
  border: 'rgba(148, 163, 184, 0.25)',
  header: '#0F172A',
  muted: '#64748B',
  shadow: 'rgba(0,0,0,0.08)',
} as const;

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
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const cardWidth = (width - SCREEN_PAD_X * 2 - spacing[4]) / 2;
  const cardHeight = cardWidth * 0.85; // 👈 reduced height

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[COLORS.gradTop, COLORS.gradBottom]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
              
              {/* Gradient Badge */}
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerBadge}
              >
                <Text style={styles.welcome}>Welcome Back</Text>
              </LinearGradient>

              <Text style={styles.subtitle}>
                Choose how you want to continue
              </Text>
            </View>

            {/* PORTAL SECTION */}
            <View style={styles.portalSection}>
              {PORTALS.map((p) => (
                <View
                  key={p.label}
                  style={[
                    styles.cardWrapper,
                    {
                      width: cardWidth,
                      height: cardHeight,
                    },
                  ]}
                >
                  {/* Centering Layer */}
                  <View style={styles.cardInner}>
                    <PortalCard
                      label={p.label}
                      title={p.title}
                      icon={p.icon}
                      iconTint={p.iconTint}
                      href={p.href}
                      width={cardWidth}
                      height={cardHeight}
                      borderColor="transparent"
                      surfaceColor="transparent"
                      labelColor={COLORS.muted}
                      titleColor={COLORS.header}
                      iconCircleAlpha="18"
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* FOOTER */}
            <View
              style={[
                styles.footer,
                {
                  paddingBottom: Math.max(
                    spacing[6],
                    insets.bottom + spacing[4]
                  ),
                },
              ]}
            >
              <Text style={styles.footerText}>
                Need help?{' '}
                <Text style={styles.supportLink}>Contact Support</Text>
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

  container: {
    flex: 1,
    paddingHorizontal: SCREEN_PAD_X,
    justifyContent: 'space-between',
  },

  /* HEADER */
  header: {
    marginTop: -15, // 👈 exact as requested
  },

  headerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 16,
  },

  welcome: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },

  subtitle: {
    marginTop: spacing[2],
    fontSize: 15,
    color: COLORS.muted,
    fontWeight: '500',
  },

  /* PORTALS */
  portalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[6],
  },

  cardWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },

  cardInner: {
    flex: 1,
    justifyContent: 'center',  // 👈 vertical center
    alignItems: 'center',      // 👈 horizontal center
  },

  /* FOOTER */
  footer: {
    alignItems: 'center',
  },

  footerText: {
    fontSize: 14,
    color: COLORS.muted,
  },

  supportLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});