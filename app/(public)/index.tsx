import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#6C4CF1';

export default function HomePage() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.root, { width: screenWidth, height: screenHeight }]}>
      {/* Full-screen background: explicit size so it stretches to cover on mobile */}
      <ImageBackground
        source={require('@/assets/bg-grain-purple.png')}
        resizeMode="cover"
        style={[styles.background, { width: screenWidth, height: screenHeight }]}
        imageStyle={[styles.backgroundImage, { width: screenWidth, height: screenHeight }]}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.5)']}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      {/* CONTENT */}
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>EduCore</Text>

          <Pressable onPress={() => router.push('/demo')}>
            <Text style={styles.demoText}>Schedule a Demo →</Text>
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.title}>
            Run your entire{'\n'}
            school{'\n'}
            beautifully.
          </Text>

          <Text style={styles.subtitle}>
            A modern ERP platform built for ambitious institutions.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Pressable
            onPress={() => router.push('/signup')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryText}>Create Account</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryText}>Sign In</Text>
          </Pressable>

          <Text style={styles.legal}>
            By joining, you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a0a2e', // fallback (dark purple) while image loads
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backgroundImage: {
    // Force the image to fill the container so it stretches to full screen on mobile
  },

  safe: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 24 : 28,
    justifyContent: 'space-between',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logo: {
    fontFamily: 'PlayfairBold',
    fontSize: 22,
    color: '#ffffff',
  },

  demoText: {
    fontFamily: 'Playfair',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },

  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontFamily: 'PlayfairBold',
    fontSize: 42,
    lineHeight: 50,
    color: '#ffffff',
    textAlign: 'center',
  },

  subtitle: {
    fontFamily: 'Playfair',
    marginTop: 20,
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    maxWidth: 320,
  },

  cta: {
    gap: 14,
  },

  primaryButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
  },

  primaryText: {
    fontFamily: 'PlayfairBold',
    fontSize: 17,
    color: '#ffffff',
  },

  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
  },

  secondaryText: {
    fontFamily: 'PlayfairBold',
    fontSize: 17,
    color: PRIMARY,
  },

  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  legal: {
    fontFamily: 'Playfair',
    marginTop: 18,
    fontSize: 12,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
  },
});