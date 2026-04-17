import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  primary:       '#7C3AED',
  primaryLight:  '#9F67F7',
  primaryXLight: '#F3EEFF',
  primaryBorder: '#DDD6FE',
  bg:            '#FEFCFF',
  text:          '#1C1128',
  textMuted:     '#6B7280',
  textAccent:    '#5B21B6',
  badgeBg:       '#F5F0FF',
  badgeBg2:      '#FDF4FF',
  eyebrow:       '#9061F9',
  dot:           '#DDD6FE',
  overlayGrad:   'rgba(76,29,149,0.18)',
  white:         '#fff',
};

// ─── Constants ────────────────────────────────────────────────────────────────
const HERO_IMAGE =
  'https://unsplash.com/photos/group-of-people-wearing-white-and-orange-backpacks-walking-on-gray-concrete-pavement-during-daytime-CYlPykF-qAM';
const IMAGE_HEIGHT = 280;
const THUMB_SIZE   = 50;
const TRACK_HEIGHT = 62;

// ─── Component ────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router       = useRouter();
  const { width }    = useWindowDimensions();
  const trackWidth   = width - 48 - 12; // paddingH * 2 - padding inside track

  // Fonts
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  // ── Entrance animations ──────────────────────────────────────────────────
  const fadeY = (delay: number) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(anim, {
        toValue:         1,
        duration:        520,
        delay,
        easing:          Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, []);
    return anim;
  };

  const aLogo   = fadeY(80);
  const aHero   = fadeY(200);
  const aBadge  = fadeY(300);
  const aText   = fadeY(380);
  const aDots   = fadeY(440);
  const aCta    = fadeY(500);

  const makeAnimStyle = (anim: Animated.Value) => ({
    opacity:   anim,
    transform: [{
      translateY: anim.interpolate({
        inputRange:  [0, 1],
        outputRange: [18, 0],
      }),
    }],
  });

  // ── Slider ───────────────────────────────────────────────────────────────
  const slideX        = useRef(new Animated.Value(0)).current;
  const labelOpacity  = useRef(new Animated.Value(1)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const maxSlide       = trackWidth - THUMB_SIZE;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,

      onPanResponderMove: (_, g) => {
        const x = Math.min(Math.max(g.dx, 0), maxSlide);
        slideX.setValue(x);
        const progress = x / maxSlide;
        labelOpacity.setValue(Math.max(0, 1 - progress * 2.5));
        successOpacity.setValue(progress > 0.85 ? (progress - 0.85) / 0.15 : 0);
      },

      onPanResponderRelease: (_, g) => {
        const progress = Math.min(Math.max(g.dx, 0), maxSlide) / maxSlide;

        if (progress > 0.75) {
          // Success path
          Animated.parallel([
            Animated.timing(slideX, {
              toValue:         maxSlide,
              duration:        200,
              useNativeDriver: true,
            }),
            Animated.timing(successOpacity, {
              toValue:         1,
              duration:        200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setTimeout(() => router.push('/login'), 600);
          });
        } else {
          // Reset path
          Animated.parallel([
            Animated.spring(slideX, {
              toValue:         0,
              useNativeDriver: true,
              tension:         120,
              friction:        10,
            }),
            Animated.timing(labelOpacity, {
              toValue:         1,
              duration:        250,
              useNativeDriver: true,
            }),
            Animated.timing(successOpacity, {
              toValue:         0,
              duration:        200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  if (!fontsLoaded) return null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#F8F4FF', '#EEF2FF']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* LOGO */}
        <Animated.View style={[styles.logoRow, makeAnimStyle(aLogo)]}>
          <LinearGradient
            colors={[C.primary, C.primaryLight]}
            style={styles.logoIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoIconText}>✦</Text>
          </LinearGradient>
          <Text style={styles.logoText}>EduCore</Text>
        </Animated.View>

        {/* HERO IMAGE */}
        <Animated.View style={[styles.heroSection, makeAnimStyle(aHero)]}>
          <View style={styles.imageFrame}>
            <Image
              source={{ uri: HERO_IMAGE }}
              contentFit="cover"
              contentPosition="top"
              style={styles.image}
            />
            {/* Bottom gradient overlay */}
            <LinearGradient
              colors={['transparent', C.overlayGrad]}
              style={styles.imageOverlay}
              pointerEvents="none"
            />
          </View>
        </Animated.View>

        {/* TEXT BLOCK */}
        <Animated.View style={[styles.textContainer, makeAnimStyle(aText)]}>
          <Text style={styles.eyebrow}>Your Learning Companion</Text>
          <Text style={styles.title}>
            Thrilled to Join{'\n'}Your{' '}
            <Text style={styles.titleItalic}>Learning{'\n'}Journey!</Text>
          </Text>
          <Text style={styles.subtitle}>
            Making learning easy and fun, reach your goals with personalised study sessions.
          </Text>
        </Animated.View>

        {/* DOTS */}
        <Animated.View style={[styles.dotsRow, makeAnimStyle(aDots)]}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Animated.View>

        {/* SLIDE CTA */}
        <Animated.View style={[styles.sliderContainer, makeAnimStyle(aCta)]}>
          <View style={styles.sliderTrack}>

            {/* Success overlay */}
            <Animated.View
              style={[styles.successOverlay, { opacity: successOpacity }]}
              pointerEvents="none"
            >
              <Text style={styles.successText}>✓  Let's begin</Text>
            </Animated.View>

            {/* Label */}
            <Animated.View
              style={[styles.labelWrap, { opacity: labelOpacity }]}
              pointerEvents="none"
            >
              <Text style={styles.sliderLabel}>Slide to Continue  →</Text>
            </Animated.View>

            {/* Thumb */}
            <Animated.View
              style={[
                styles.thumb,
                { transform: [{ translateX: slideX }] },
              ]}
              {...panResponder.panHandlers}
            >
            <LinearGradient
  colors={['#FFFFFF', '#F3EEFF', '#E9EFFF', '#EEF2FF']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.container}
>
                <Text style={styles.thumbArrow}>›</Text>
              </LinearGradient>
            </Animated.View>

          </View>
        </Animated.View>

      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safe: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 20 : 28,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },

  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoIconText: {
    color: C.white,
    fontSize: 13,
  },

  logoText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: '#4C1D95',
    letterSpacing: -0.3,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginTop: 8,
  },

  imageFrame: {
    width: '62%',
    height: IMAGE_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#EDE9FE',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.badgeBg,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  badgeAlt: {
    backgroundColor: C.badgeBg2,
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: C.primary,
  },

  badgeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: C.textAccent,
  },

  // Text
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  eyebrow: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: C.eyebrow,
    marginBottom: 10,
  },

  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
    color: C.text,
    marginBottom: 12,
  },

  titleItalic: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    color: C.primary,
  },

  subtitle: {
    fontFamily: 'DMSans_300Light',
    fontSize: 14,
    lineHeight: 22,
    color: C.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: C.dot,
  },

  dotActive: {
    width: 20,
    borderRadius: 4,
    backgroundColor: C.primary,
  },

  // Slider
  sliderContainer: {
    marginBottom: 4,
  },

  sliderTrack: {
    backgroundColor: C.primaryXLight,
    borderRadius: 999,
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    overflow: 'hidden',
  },

  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successText: {
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    fontSize: 16,
    color: C.white,
  },

  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sliderLabel: {
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    fontSize: 15,
    color: C.primary,
  },

  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 999,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: C.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  thumbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  thumbArrow: {
    color: C.white,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -2,
  },
});