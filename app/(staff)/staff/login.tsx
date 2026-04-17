/**
 * Staff / Teacher Login — green & white gradient, glass card, Playfair Display.
 * Matches reference: vibrant green/white bg, EduCore nav, Login as Staff card, rounded inputs, accent-green button.
 */

import { LoginForm } from '@/components/forms';
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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#1d283a';
const ACCENT_GREEN = '#10b981';
const CARD_BG = 'rgba(255, 255, 255, 0.95)';
const BORDER_LIGHT = 'rgba(255, 255, 255, 0.4)';

export default function StaffLoginScreen() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.root, { width: screenWidth, height: screenHeight }]}>
      {/* Green & white gradient background */}
      <LinearGradient
        colors={['#d1fae5', '#ecfdf5', '#ffffff', '#a7f3d0', '#ecfdf5']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={[StyleSheet.absoluteFill, { width: screenWidth, height: screenHeight }]}
      />
      <LinearGradient
        colors={['rgba(110, 231, 183, 0.35)', 'transparent', 'rgba(52, 211, 153, 0.25)', 'transparent']}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={[StyleSheet.absoluteFill, { width: screenWidth, height: screenHeight }]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(167, 243, 208, 0.3)', 'transparent']}
        start={{ x: 0, y: 0.6 }}
        end={{ x: 1, y: 0.4 }}
        style={[StyleSheet.absoluteFill, { width: screenWidth, height: screenHeight }]}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
     

            {/* Glass card */}
            <View style={styles.card}>
              <Text style={styles.title}>Login as Staff</Text>
              <Text style={styles.subtitle}>
                Sign in with school code, staff ID and password
              </Text>

              {/* Form */}
              <LoginForm
                role="teacher"
                submitLabel="Login"
                fontFamily="Playfair"
                buttonFontFamily="PlayfairBold"
                palette={{
                  primary: ACCENT_GREEN,
                  accent: ACCENT_GREEN,
                  textPrimary: PRIMARY,
                  textSecondary: `${PRIMARY}99`,
                  border: `${PRIMARY}15`,
                  cardBg: `${PRIMARY}08`,
                  background: CARD_BG,
                  textInverse: '#ffffff',
                }}
              />

              {/* Or login with */}
              <View style={styles.dividerWrap}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or login with</Text>
                <View style={styles.dividerLine} />
              </View>
              <View style={styles.altButtons}>
                <Pressable style={styles.altBtn}>
                  <Ionicons name="logo-google" size={22} color={PRIMARY} />
                </Pressable>
                <Pressable style={styles.altBtn}>
                  <Ionicons name="finger-print" size={22} color={PRIMARY} />
                </Pressable>
              </View>
            </View>

            {/* Footer links */}
            <View style={styles.footer}>
              <Pressable><Text style={styles.footerLink}>Support</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>Privacy Policy</Text></Pressable>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ecfdf5',
  },
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: spacing[12],
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontFamily: 'Playfair',
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
  },
  demoLink: {
    fontFamily: 'Playfair',
    fontSize: 14,
    fontWeight: '600',
    color: `${PRIMARY}b3`,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontFamily: 'PlayfairBold',
    fontSize: 28,
    color: PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Playfair',
    fontSize: 15,
    color: `${PRIMARY}80`,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${PRIMARY}18`,
  },
  dividerText: {
    fontFamily: 'PlayfairBold',
    fontSize: 11,
    letterSpacing: 1.2,
    color: `${PRIMARY}4d`,
  },
  altButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  altBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: `${PRIMARY}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 28,
  },
  footerLink: {
    fontFamily: 'Playfair',
    fontSize: 13,
    color: `${PRIMARY}99`,
    fontWeight: '500',
  },
});
