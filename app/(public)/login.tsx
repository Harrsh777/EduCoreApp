import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#7C3AED';
const SECONDARY = '#F472B6';

export default function LoginHubScreen() {
  return (
    <LinearGradient
      colors={['#F5F3FF', '#EFF6FF']}
      style={styles.root}
    >
      <SafeAreaView style={styles.safe}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Ionicons name="school" size={20} color="#fff" />
          </View>
          <Text style={styles.brand}>EduCore</Text>
        </View>

        {/* TITLE */}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>
            Welcome Back 👋
          </Text>
          <Text style={styles.subtitle}>
            Choose your role to continue
          </Text>
        </View>

        {/* MAIN BOX */}
        <View style={styles.roleBox}>

          {/* STUDENT */}
          <Link href="/student/login" asChild>
            <Pressable style={({ pressed }) => [
              styles.roleCard,
              { backgroundColor: '#EEF2FF' },
              pressed && styles.pressed
            ]}>
              <View style={[styles.iconWrap, { backgroundColor: '#C7D2FE' }]}>
                <Ionicons name="person" size={22} color={PRIMARY} />
              </View>

              <Text style={styles.roleTitle}>Student</Text>
              <Text style={styles.roleDesc}>
                Access classes & grades
              </Text>
            </Pressable>
          </Link>

          {/* STAFF */}
          <Link href="/staff/login" asChild>
            <Pressable style={({ pressed }) => [
              styles.roleCard,
              { backgroundColor: '#FCE7F3' },
              pressed && styles.pressed
            ]}>
              <View style={[styles.iconWrap, { backgroundColor: '#FBCFE8' }]}>
                <Ionicons name="briefcase" size={22} color={SECONDARY} />
              </View>

              <Text style={styles.roleTitle}>Staff</Text>
              <Text style={styles.roleDesc}>
                Manage classes & tools
              </Text>
            </Pressable>
          </Link>

        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help?
          </Text>
          <Text style={styles.link}>
            Contact support
          </Text>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  safe: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  brand: {
    fontFamily: 'PlayfairBold',
    fontSize: 22,
    color: '#1F2937',
  },

  titleWrap: {
    marginTop: 40,
  },

  title: {
    fontFamily: 'PlayfairBold',
    fontSize: 30,
    color: '#111827',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: '#6B7280',
  },

  roleBox: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 30,
  },

  roleCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 14,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },

  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  roleTitle: {
    fontFamily: 'PlayfairBold',
    fontSize: 18,
    color: '#111827',
  },

  roleDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  footer: {
    alignItems: 'center',
  },

  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },

  link: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },

  pressed: {
    transform: [{ scale: 0.96 }],
  },
});