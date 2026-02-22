/**
 * Student Portal Login - Fully Fixed Version
 * - Full-screen gradient
 * - Blue → Navy → White login button gradient
 * - Proper SafeArea + Scroll handling
 * - Clean centered layout
 */

import { LoginForm, type RenderButtonArgs } from '@/components/forms';
import { spacing } from '@/theme/spacing';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NAVY = '#0f172a';
const BLUE = '#3b82f6';
const WHITE = '#ffffff';
const SLATE_BORDER = '#e2e8f0';

export default function StudentLoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      {/* FULL SCREEN BACKGROUND GRADIENT */}
      <LinearGradient
        colors={['#dbeafe', '#bfdbfe', '#93c5fd', '#e0f2fe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.logoIcon}>
                  <Ionicons name="school" size={22} color={WHITE} />
                </View>
                <Text style={styles.logoText}>EduCore</Text>
              </View>

              <Pressable onPress={() => router.push('/demo')}>
                <Text style={styles.demoLink}>Schedule a Demo</Text>
              </Pressable>
            </View>

            {/* MAIN CONTENT */}
            <View style={styles.main}>
              <Text style={styles.title}>Student Portal</Text>
              <Text style={styles.subtitle}>
                Access your learning dashboard
              </Text>

              {/* LOGIN CARD */}
              <View style={styles.card}>
                <LoginForm
                  role="student"
                  fontFamily="Playfair"
                  buttonFontFamily="PlayfairBold"
                  renderButton={({ onPress, label }: RenderButtonArgs) => (
                    <Pressable
                      onPress={onPress}
                      style={styles.buttonWrapper}
                    >
                      <LinearGradient
                        colors={[BLUE, NAVY, WHITE]}
                        locations={[0, 0.6, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.buttonText}>
                          {label || 'Login'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  )}
                />

                {/* SUPPORT */}
                <View style={styles.supportWrap}>
                  <Text style={styles.supportText}>
                    Need help?{' '}
                    <Text style={styles.supportLink}>
                      Contact Support
                    </Text>
                  </Text>
                </View>
              </View>

              {/* FOOTER INDICATORS */}
              <View style={styles.indicators}>
                <View style={styles.indicator}>
                  <Ionicons name="shield-checkmark" size={14} color={NAVY} />
                  <Text style={styles.indicatorText}>SECURE ACCESS</Text>
                </View>

                <View style={styles.indicator}>
                  <Ionicons name="cloud-done" size={14} color={NAVY} />
                  <Text style={styles.indicatorText}>SYNCED LIVE</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: spacing[12],
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: NAVY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    fontFamily: 'PlayfairBold',
    fontSize: 20,
    color: NAVY,
  },

  demoLink: {
    fontFamily: 'Playfair',
    fontSize: 14,
    color: NAVY,
    opacity: 0.7,
  },

  main: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },

  title: {
    fontFamily: 'PlayfairBold',
    fontSize: 36,
    color: NAVY,
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontFamily: 'Playfair',
    fontSize: 18,
    textAlign: 'center',
    color: NAVY,
    opacity: 0.6,
    marginBottom: 32,
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 28,
    marginBottom: 28,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },

  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 18,
  },

  gradientButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    fontFamily: 'PlayfairBold',
    fontSize: 16,
    color: WHITE,
  },

  supportWrap: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: SLATE_BORDER,
    alignItems: 'center',
  },

  supportText: {
    fontFamily: 'Playfair',
    fontSize: 14,
    color: NAVY,
    opacity: 0.6,
  },

  supportLink: {
    fontFamily: 'PlayfairBold',
    color: NAVY,
  },

  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    opacity: 0.6,
  },

  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  indicatorText: {
    fontFamily: 'PlayfairBold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: NAVY,
  },
});