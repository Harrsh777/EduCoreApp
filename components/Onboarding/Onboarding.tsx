// Premium Onboarding with Glassmorphism Design
// On web: no BlurView, no Animated.View wrapping text, no LinearGradient (solid bg only)
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function EduCoreOnboarding() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const next = () => {
    if (page < 2) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      setPage((p) => p + 1);
    }
  };

  const isWeb = Platform.OS === 'web';
  const SlideWrap = isWeb ? View : Animated.View;
  const slideStyle = isWeb ? styles.container : [styles.container, { opacity: fadeAnim }];

  const slides = [
    {
      key: '1',
      gradient: ['#4A90E2', '#7B68EE', '#9D7BEA'] as const,
      content: (
        <SlideWrap style={slideStyle}>
          <View style={styles.floatingIcons}>
            <View style={[styles.iconCircle, { top: 80, left: 30 }]}>
              <Text style={styles.iconText}>¥</Text>
            </View>
            <View style={[styles.iconCircle, { top: 100, right: 40 }]}>
              <Text style={styles.iconText}>£</Text>
            </View>
            <View style={[styles.iconCircle, { top: 180, right: 30 }]}>
              <Text style={styles.iconText}>€</Text>
            </View>
            <View style={[styles.iconCircle, { bottom: 350, left: 40 }]}>
              <Text style={styles.iconText}>$</Text>
            </View>
            <View style={[styles.iconCircle, { bottom: 300, right: 50 }]}>
              <Text style={styles.iconText}>₿</Text>
            </View>
          </View>

          <View style={styles.cardContainer}>
            {isWeb ? (
              <View style={[styles.glassCard, { backgroundColor: '#ffffffdd' }]}>
                <View style={styles.cardContent}>
                  <View style={styles.cardMini}>
                    <Text style={styles.cardNumber}>•••• 1567</Text>
                    <Text style={styles.cardBalance}>$8,600</Text>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardIconText}>$</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <BlurView intensity={40} tint="light" style={styles.glassCard}>
                <View style={styles.cardContent}>
                  <View style={styles.cardMini}>
                    <Text style={styles.cardNumber}>•••• 1567</Text>
                    <Text style={styles.cardBalance}>$8,600</Text>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardIconText}>$</Text>
                    </View>
                  </View>
                </View>
              </BlurView>
            )}
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.mainTitle}>
              148 countries.{'\n'}60 currencies.{'\n'}One smart account.
            </Text>
          </View>

          <BottomButton label="Next" onPress={next} />
        </SlideWrap>
      ),
    },
    {
      key: '2',
      gradient: ['#5BA4E5', '#7B9FE8', '#8B9AE9'] as const,
      content: (
        <SlideWrap style={slideStyle}>
          <View style={styles.dashboardContainer}>
            {isWeb ? (
              <View style={[styles.dashboardCard, { backgroundColor: '#ffffffdd' }]}>
              <View style={styles.dashHeader}>
                <View style={styles.userSection}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>J</Text>
                  </View>
                  <Text style={styles.greeting}>Hello, James</Text>
                </View>
                <View style={styles.notifIcon}>
                  <Text style={styles.notifDot}>•</Text>
                </View>
              </View>

              <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>Total balance</Text>
                <Text style={styles.balanceAmount}>$8,600</Text>
              </View>

              <View style={styles.cardsRow}>
                <Text style={styles.cardsLabel}>CARDS</Text>
                <Text style={styles.addCard}>Add +</Text>
              </View>

              <View style={styles.miniCards}>
                <View style={[styles.miniCard, { backgroundColor: '#4A7EBB' }]}>
                  <Text style={styles.miniCardType}>VISA</Text>
                  <Text style={styles.miniCardAmount}>$2,250</Text>
                </View>
                <View style={[styles.miniCard, { backgroundColor: '#2C3E50' }]}>
                  <Text style={styles.miniCardType}>VISA</Text>
                  <Text style={styles.miniCardAmount}>$3,280</Text>
                </View>
                <View style={[styles.miniCard, { backgroundColor: '#E84C8B' }]}>
                  <Text style={styles.miniCardType}>VISA</Text>
                  <Text style={styles.miniCardAmount}>$1,78</Text>
                </View>
              </View>

              <View style={styles.menuIcon}>
                <View style={styles.menuBar} />
                <View style={styles.menuBar} />
                <View style={styles.menuBar} />
              </View>
              </View>
            ) : (
              <BlurView intensity={50} tint="light" style={styles.dashboardCard}>
                <View style={styles.dashHeader}>
                  <View style={styles.userSection}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>J</Text>
                    </View>
                    <Text style={styles.greeting}>Hello, James</Text>
                  </View>
                  <View style={styles.notifIcon}>
                    <Text style={styles.notifDot}>•</Text>
                  </View>
                </View>
                <View style={styles.balanceSection}>
                  <Text style={styles.balanceLabel}>Total balance</Text>
                  <Text style={styles.balanceAmount}>$8,600</Text>
                </View>
                <View style={styles.cardsRow}>
                  <Text style={styles.cardsLabel}>CARDS</Text>
                  <Text style={styles.addCard}>Add +</Text>
                </View>
                <View style={styles.miniCards}>
                  <View style={[styles.miniCard, { backgroundColor: '#4A7EBB' }]}>
                    <Text style={styles.miniCardType}>VISA</Text>
                    <Text style={styles.miniCardAmount}>$2,250</Text>
                  </View>
                  <View style={[styles.miniCard, { backgroundColor: '#2C3E50' }]}>
                    <Text style={styles.miniCardType}>VISA</Text>
                    <Text style={styles.miniCardAmount}>$3,280</Text>
                  </View>
                  <View style={[styles.miniCard, { backgroundColor: '#E84C8B' }]}>
                    <Text style={styles.miniCardType}>VISA</Text>
                    <Text style={styles.miniCardAmount}>$1,78</Text>
                  </View>
                </View>
                <View style={styles.menuIcon}>
                  <View style={styles.menuBar} />
                  <View style={styles.menuBar} />
                  <View style={styles.menuBar} />
                </View>
              </BlurView>
            )}
          </View>

          <View style={styles.textContent}>
            <Text style={styles.mainTitle}>
              Your accounts,{'\n'}always within reach{'\n'}— in one sleek app
            </Text>
          </View>

          <BottomButton label="Next" onPress={next} />
        </SlideWrap>
      ),
    },
    {
      key: '3',
      gradient: ['#5B7FD8', '#7B6ED9', '#9B6FD5'] as const,
      content: (
        <SlideWrap style={slideStyle}>
          <View style={styles.welcomeCardContainer}>
            {isWeb ? (
              <View style={[styles.welcomeCard, { backgroundColor: '#ffffffdd' }]}>
                <Text style={styles.welcomeTitle}>Welcome to EduCore</Text>
                <Text style={styles.welcomeSubtitle}>
                  Sign in, create an account, or request a demo to get started.
                </Text>
              </View>
            ) : (
              <BlurView intensity={50} tint="light" style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>Welcome to EduCore</Text>
                <Text style={styles.welcomeSubtitle}>
                  Sign in, create an account, or request a demo to get started.
                </Text>
              </BlurView>
            )}
          </View>

          {/* Action options – connected to forms */}
          <View style={styles.actionButtons}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/demo')}
            >
              <Text style={styles.primaryButtonText}>Request a Demo</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </Pressable>

            <Pressable
              style={styles.outlineButton}
              onPress={() => router.push('/signup')}
            >
              <Text style={styles.outlineButtonText}>Sign Up</Text>
            </Pressable>
          </View>
        </SlideWrap>
      ),
    },
  ];

  const slide = slides[page];

  return (
    <SafeAreaView style={styles.root}>
      {isWeb ? (
        <View style={[styles.gradient, { backgroundColor: slide.gradient[0] }]}>
          {slide.content}
        </View>
      ) : (
        <LinearGradient colors={slide.gradient} style={styles.gradient}>
          {slide.content}
        </LinearGradient>
      )}
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, page === i && styles.dotActive]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

function BottomButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.bottomContainer}>
      <Pressable style={styles.nextButton} onPress={onPress}>
        <Text style={styles.nextButtonText}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#5B8FE8',
  },
  gradient: {
    flex: 1,
    width,
    height,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  
  // Slide 1 - Currency Icons
  floatingIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  iconCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Main Card Slide 1
  cardContainer: {
    marginTop: height * 0.15,
    alignItems: 'center',
  },
  glassCard: {
    width: width * 0.75,
    height: 240,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  cardMini: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardNumber: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  cardBalance: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  cardIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconText: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: '700',
  },
  
  // Slide 2 - Dashboard
  dashboardContainer: {
    marginTop: height * 0.12,
    alignItems: 'center',
  },
  dashboardCard: {
    width: width * 0.85,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    padding: 24,
  },
  dashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  notifIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    fontSize: 24,
    color: '#fff',
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  addCard: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  miniCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  miniCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    height: 90,
    justifyContent: 'space-between',
  },
  miniCardType: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
  },
  miniCardAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  menuIcon: {
    alignSelf: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  menuBar: {
    width: 20,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  
  // Slide 3 - Final Cards
  finalCardsContainer: {
    marginTop: height * 0.12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  cryptoCard: {
    width: width * 0.42,
    height: 200,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cryptoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7931A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cryptoSymbol: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  cryptoLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  cryptoAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  cryptoCode: {
    fontSize: 11,
    color: '#999',
  },
  visaCard: {
    width: width * 0.42,
    height: 200,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'space-between',
  },
  visaLogo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F71',
  },
  salaryLabel: {
    fontSize: 11,
    color: '#666',
  },
  salaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardNumSmall: {
    fontSize: 11,
    color: '#999',
  },
  cardExpiry: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    fontSize: 11,
    color: '#999',
  },
  
  // Text Content
  textContent: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 40,
    textAlign: 'left',
  },
  
  // Slide 3 – Welcome & options
  welcomeCardContainer: {
    marginTop: height * 0.12,
    paddingHorizontal: 8,
  },
  welcomeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 24,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Action Buttons (Slide 3) – connected to login, signup, demo forms
  actionButtons: {
    marginBottom: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B7FD8',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  outlineButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Bottom Button
  bottomContainer: {
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B7FD8',
  },
  
  // Dots Indicator
  dots: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
});