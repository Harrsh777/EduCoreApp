/**
 * School Admin Login - Vibrant & Aesthetic Edition
 * Features: Dynamic gradients, smooth animations, modern glass morphism
 */

import { LoginForm } from '@/components/forms';
import { shadowStyle } from '@/theme/shadowWeb';
import { spacing } from '@/theme/spacing';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function AdminLoginScreen() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const shouldAnimate = Platform.OS !== 'web';
  useEffect(() => {
    if (!shouldAnimate) return;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [shouldAnimate]);

  const AnimatedOrView = shouldAnimate ? Animated.View : View;
  const animStyle = shouldAnimate ? { opacity: fadeAnim, transform: [{ translateY: slideAnim }] } : undefined;

  return (
    <View style={styles.root}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#667eea' }]} />
      ) : (
        <>
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.4)', 'rgba(139, 92, 246, 0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}

      {shouldAnimate ? (
        <Animated.View style={[styles.blob, styles.blob1, { transform: [{ scale: pulseAnim }] }]} />
      ) : (
        <View style={[styles.blob, styles.blob1]} />
      )}
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <AnimatedOrView style={animStyle}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/login');
            }}
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </View>
          </Pressable>
        </AnimatedOrView>

        {/* Header Section */}
        <AnimatedOrView style={[styles.header, animStyle]}>
          {Platform.OS === 'web' ? (
            <View style={styles.iconContainer}>
              <View style={[styles.iconGlow, { backgroundColor: '#1e3a5f' }]} />
              <View style={[styles.iconInner, { backgroundColor: '#60a5fa' }]}>
                <Ionicons name="shield-checkmark" size={40} color="#ffffff" />
              </View>
            </View>
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LinearGradient
                colors={['#60a5fa', '#a78bfa', '#f472b6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <View style={styles.iconGlow} />
                <View style={styles.iconInner}>
                  <Ionicons name="shield-checkmark" size={40} color="#ffffff" />
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>
            Secure access to your dashboard
          </Text>
          
          {/* Decorative line */}
          <View style={styles.decorativeLine}>
            <View style={styles.lineGlow} />
          </View>
        </AnimatedOrView>

        {/* Main Card */}
        <AnimatedOrView style={animStyle}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.cardWrapper}>
              {Platform.OS !== 'web' && (
                <LinearGradient
                  colors={['rgba(168, 85, 247, 0.4)', 'rgba(59, 130, 246, 0.4)']}
                  style={styles.cardGlow}
                />
              )}
              {Platform.OS === 'web' && <View style={[styles.cardGlow, { backgroundColor: '#1e3a5f', opacity: 1 }]} />}
              <View style={styles.card}>
                {Platform.OS === 'web' ? (
                  <View style={[styles.cardGradient, { backgroundColor: '#f8fafc' }]}>
                    <LoginForm role="admin" submitLabel="Access Dashboard" fontFamily="Playfair" buttonFontFamily="PlayfairBold" />
                  </View>
                ) : (
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                    style={styles.cardGradient}
                  >
                    <LoginForm role="admin" submitLabel="Access Dashboard" fontFamily="Playfair" buttonFontFamily="PlayfairBold" />
                  </LinearGradient>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </AnimatedOrView>

        {/* Feature Pills */}
        <AnimatedOrView style={[styles.featuresContainer, animStyle]}>
          <View style={styles.featurePill}>
            <Ionicons name="lock-closed" size={14} color="#a78bfa" />
            <Text style={styles.featureText}>Encrypted</Text>
          </View>
          
          <View style={styles.featurePill}>
            <Ionicons name="shield" size={14} color="#60a5fa" />
            <Text style={styles.featureText}>Secure</Text>
          </View>
          
          <View style={styles.featurePill}>
            <Ionicons name="flash" size={14} color="#f472b6" />
            <Text style={styles.featureText}>Fast Access</Text>
          </View>
        </AnimatedOrView>

        {/* Footer */}
        <AnimatedOrView style={animStyle}>
          <Text style={styles.footerText}>
            Protected by enterprise-grade security
          </Text>
        </AnimatedOrView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1,
    backgroundColor: '#667eea',
  },

  scroll: { 
    flex: 1,
  },

  content: {
    padding: spacing[6],
    paddingTop: spacing[12],
    paddingBottom: spacing[16],
  },

  /* Floating animated orbs */
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.2,
  },
  blob1: {
    width: 300,
    height: 300,
    backgroundColor: '#fbbf24',
    top: -80,
    right: -60,
    ...(Platform.OS === 'web' ? shadowStyle({ shadowColor: '#fbbf24', shadowOpacity: 0.5, shadowRadius: 40 }) : { shadowColor: '#fbbf24', shadowOpacity: 0.5, shadowRadius: 40 }),
  },
  blob2: {
    width: 240,
    height: 240,
    backgroundColor: '#f472b6',
    bottom: -40,
    left: -50,
    ...(Platform.OS === 'web' ? shadowStyle({ shadowColor: '#f472b6', shadowOpacity: 0.5, shadowRadius: 40 }) : { shadowColor: '#f472b6', shadowOpacity: 0.5, shadowRadius: 40 }),
  },
  blob3: {
    width: 200,
    height: 200,
    backgroundColor: '#60a5fa',
    top: '40%',
    right: -30,
    ...(Platform.OS === 'web' ? shadowStyle({ shadowColor: '#60a5fa', shadowOpacity: 0.5, shadowRadius: 40 }) : { shadowColor: '#60a5fa', shadowOpacity: 0.5, shadowRadius: 40 }),
  },

  /* Back button */
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing[8],
  },

  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Platform.OS === 'web' ? '#404040' : 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: Platform.OS === 'web' ? '#525252' : 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? shadowStyle({ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }) : { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }),
  },

  /* Header */
  header: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },

  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
    ...(Platform.OS === 'web' ? shadowStyle({ shadowColor: '#a78bfa', shadowOpacity: 0.6, shadowRadius: 25, shadowOffset: { width: 0, height: 12 }, elevation: 15 }) : { shadowColor: '#a78bfa', shadowOpacity: 0.6, shadowRadius: 25, shadowOffset: { width: 0, height: 12 }, elevation: 15 }),
  },

  iconGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: Platform.OS === 'web' ? '#4d4d4d' : 'rgba(255, 255, 255, 0.3)',
  },

  iconInner: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: Platform.OS === 'web' ? '#4d4d4d' : 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: Platform.OS === 'web' ? '#737373' : 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 38,
    fontWeight: '900',
    marginBottom: 8,
    color: '#ffffff',
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: Platform.OS === 'web' ? '#e6e6e6' : 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing[6],
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  decorativeLine: {
    width: 60,
    height: 4,
    backgroundColor: Platform.OS === 'web' ? '#737373' : 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    marginTop: spacing[4],
    overflow: 'hidden',
  },

  lineGlow: {
    width: '50%',
    height: '100%',
    backgroundColor: '#ffffff',
    ...(Platform.OS === 'web' ? shadowStyle({ shadowColor: '#ffffff', shadowOpacity: 0.8, shadowRadius: 8 }) : { shadowColor: '#ffffff', shadowOpacity: 0.8, shadowRadius: 8 }),
  },

  /* Card */
  cardWrapper: {
    position: 'relative',
    marginBottom: spacing[8],
  },

  cardGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
    opacity: 0.6,
  },

  card: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Platform.OS === 'web' ? '#a3a3a3' : 'rgba(255, 255, 255, 0.5)',
    ...(Platform.OS === 'web' ? shadowStyle({ shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 25, shadowOffset: { width: 0, height: 15 }, elevation: 15 }) : { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 25, shadowOffset: { width: 0, height: 15 }, elevation: 15 }),
  },

  cardGradient: {
    padding: spacing[8],
  },

  /* Feature pills */
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[8],
  },

  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: Platform.OS === 'web' ? '#404040' : 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Platform.OS === 'web' ? '#525252' : 'rgba(255, 255, 255, 0.4)',
  },

  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  /* Footer */
  footerText: {
    textAlign: 'center',
    color: Platform.OS === 'web' ? '#bfbfbf' : 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});