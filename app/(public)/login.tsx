/**
 * EduCore Login Hub – Clean Gradient Version
 * Matches provided screenshot layout
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROLES = [
  {
    href: '/student/login',
    title: 'Login as Student',
    description: 'Access your student portal',
    icon: 'person',
  },
  {
    href: '/staff/login',
    title: 'Login as Staff',
    description: 'Manage your classes and tools',
    icon: 'id-card',
  },
  {
    href: '/admin/login',
    title: 'Login as Admin',
    description: 'Full system control & tools',
    icon: 'shield-checkmark',
  },
];

export default function LoginHubScreen() {
  return (
    <View style={styles.root}>
      {/* Smooth Full-Screen Gradient (No Mesh) */}
      <LinearGradient
        colors={[
          '#4f46e5', // indigo
          '#7c3aed', // purple
          '#9333ea', // violet
          '#db2777', // pink blend
          '#3b82f6', // blue
          '#06b6d4', // teal
        ]}
        locations={[0, 0.25, 0.45, 0.6, 0.8, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + Brand */}
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Ionicons name="school" size={26} color="#fff" />
            </View>
            <Text style={styles.brand}>EduCore</Text>
          </View>

          {/* Title */}
          <Text style={styles.welcome}>Welcome to EduCore</Text>
          <Text style={styles.subtitle}>
            Select your role to continue
          </Text>

          {/* Centered Buttons */}
          <View style={styles.cardContainer}>
            {ROLES.map((role) => (
              <Link key={role.href} href={role.href as never} asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.card,
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={role.icon as any}
                      size={22}
                      color="#7c3aed"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {role.title}
                    </Text>
                    <Text style={styles.cardDesc}>
                      {role.description}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#94a3b8"
                  />
                </Pressable>
              </Link>
            ))}
          </View>

          {/* Footer */}
          <Text style={styles.empower}>EMPOWERING EDUCATION</Text>

          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              Need help? We're here for you.
            </Text>
            <Pressable>
              <Text style={styles.supportLink}>
                Contact School Support
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  safe: { flex: 1 },

  container: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },

  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  brand: {
    fontFamily: 'PlayfairBold',
    fontSize: 26,
    color: '#ffffff',
  },

  welcome: {
    fontFamily: 'PlayfairBold',
    fontSize: 34,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitle: {
    fontFamily: 'Playfair',
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 40,
  },

  cardContainer: {
    width: '100%',
    gap: 22,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },

  cardTitle: {
    fontFamily: 'PlayfairBold',
    fontSize: 20,
    color: '#0f172a',
    marginBottom: 4,
  },

  cardDesc: {
    fontFamily: 'Playfair',
    fontSize: 15,
    color: '#64748b',
  },

  empower: {
    marginTop: 60,
    fontFamily: 'PlayfairBold',
    fontSize: 13,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
  },

  helpSection: {
    marginTop: 28,
    alignItems: 'center',
  },

  helpText: {
    fontFamily: 'Playfair',
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
    textAlign: 'center',
  },

  supportLink: {
    fontFamily: 'PlayfairBold',
    fontSize: 17,
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
});