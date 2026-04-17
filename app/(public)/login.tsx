import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, Link } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ---------------- DESIGN SYSTEM ---------------- */

const COLORS = {
  background: '#FAF8F5',
  card: '#FFFFFF',
  primary: '#7C5CFA',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  studentBg: '#EEF4FF',
  staffBg: '#FDECF1',
};

const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 40,
};

/* ---------------- TYPES ---------------- */

type LoginOptionCardProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  href: Href;
};

/* ---------------- MAIN SCREEN ---------------- */

export default function LoginHubScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* SUBTLE BACKGROUND BLOB */}
        <View style={styles.blob} />

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Ionicons name="school" size={18} color="#fff" />
          </View>
          <Text style={styles.brand}>EduCore</Text>
        </View>

        {/* WELCOME */}
        <View style={styles.welcome}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Choose how you want to login
          </Text>
        </View>

        {/* LOGIN CONTAINER */}
        <Animated.View
          style={[
            styles.loginContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          <LoginOptionCard
            title="Login as Student"
            icon="person"
            bg={COLORS.studentBg}
            href="/student/login"
          />

          <LoginOptionCard
            title="Login as Staff"
            icon="briefcase"
            bg={COLORS.staffBg}
            href="/staff/login"
          />
        </Animated.View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Need help?</Text>
          <Text style={styles.link}>Contact support</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

/* ---------------- REUSABLE CARD ---------------- */

function LoginOptionCard({
  title,
  icon,
  bg,
  href,
}: LoginOptionCardProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.optionCard,
          { backgroundColor: bg },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#333" />
        </View>

        <Text numberOfLines={1} style={styles.optionText}>
          {title}
        </Text>
      </Pressable>
    </Link>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },

  /* BACKGROUND BLOB */
  blob: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 200,
    backgroundColor: 'rgba(124,92,250,0.08)',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },

  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  brand: {
    fontSize: 20,
    fontFamily: 'PlayfairBold',
    color: COLORS.textPrimary,
  },

  /* WELCOME */
  welcome: {
    marginTop: SPACING.xl,
  },

  title: {
    fontSize: 30,
    fontFamily: 'PlayfairBold',
    color: COLORS.textPrimary,
  },

  subtitle: {
    marginTop: SPACING.xs,
    fontSize: 14,
    fontFamily: 'Inter',
    color: COLORS.textSecondary,
  },

  /* LOGIN CONTAINER (KEY GROUPING FIX) */
  loginContainer: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  /* OPTION CARD */
  optionCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100, // ensures good tap area
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },

  optionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.textPrimary,
  },

  /* FOOTER */
  footer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  link: {
    marginTop: SPACING.xs,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  /* INTERACTION */
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});