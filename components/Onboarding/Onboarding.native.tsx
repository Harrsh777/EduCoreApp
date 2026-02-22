// Native (iOS/Android) only — uses PagerView. Not under app/ so web bundle never loads this.
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function EduCoreOnboarding() {
  const pagerRef = useRef<PagerView>(null);
  const router = useRouter();
  const [page, setPage] = useState(0);

  const next = () => {
    if (page < 2) pagerRef.current?.setPage(page + 1);
  };

  return (
    <SafeAreaView style={styles.root}>
      <PagerView
        style={{ flex: 1 }}
        initialPage={0}
        ref={pagerRef}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        <ImageBackground
          key="1"
          source={{
            uri: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
          }}
          style={styles.slide}
        >
          <LinearGradient
            colors={['rgba(124,58,237,0.65)', 'rgba(255,255,255,0.25)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardFloat}>
            <Text style={styles.brand}>EduCore</Text>
            <Text style={styles.title}>
              The Smartest{"\n"}School ERP
            </Text>
            <Text style={styles.desc}>
              Unified platform for academics,
              administration and parents — beautifully connected.
            </Text>
          </View>
          <BottomButton label="Next" onPress={next} />
        </ImageBackground>

        <ImageBackground
          key="2"
          source={{
            uri: 'https://images.unsplash.com/photo-1588072432836-e10032774350',
          }}
          style={styles.slide}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.6)', 'rgba(167,139,250,0.55)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Powering Modern Schools</Text>
            <View style={styles.statRow}>
              <Stat label="Schools" value="500+" />
              <Stat label="Students" value="120K+" />
            </View>
            <View style={styles.statRow}>
              <Stat label="Automation" value="98%" />
              <Stat label="Uptime" value="99.9%" />
            </View>
          </View>
          <BottomButton label="Next" onPress={next} />
        </ImageBackground>

        <ImageBackground
          key="3"
          source={{
            uri: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
          }}
          style={styles.slide}
        >
          <LinearGradient
            colors={['rgba(124,58,237,0.7)', 'rgba(255,255,255,0.3)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>Welcome to EduCore</Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push('/demo')}
            >
              <Text style={styles.primaryText}>Request Demo</Text>
            </Pressable>
            <Pressable
              style={styles.whiteBtn}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.whiteText}>Sign In</Text>
            </Pressable>
            <Pressable
              style={styles.outlineBtn}
              onPress={() => router.push('/signup')}
            >
              <Text style={styles.outlineText}>Sign Up</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </PagerView>
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
    <View style={styles.bottom}>
      <Pressable style={styles.nextBtn} onPress={onPress}>
        <Text style={styles.nextText}>{label}</Text>
      </Pressable>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  slide: {
    width,
    height,
    justifyContent: 'space-between',
    padding: 24,
  },
  brand: {
    fontFamily: 'PlayfairBold',
    fontSize: 34,
    color: '#4C1D95',
    textAlign: 'center',
  },
  title: {
    fontFamily: 'PlayfairBold',
    fontSize: 36,
    color: '#2E1065',
    textAlign: 'center',
    marginTop: 16,
  },
  desc: {
    fontFamily: 'Playfair',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    color: '#3F3F46',
    lineHeight: 22,
  },
  cardFloat: {
    marginTop: height * 0.18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.25,
    shadowRadius: 30,
  },
  statCard: {
    marginTop: height * 0.2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 28,
    padding: 24,
  },
  statTitle: {
    fontFamily: 'PlayfairBold',
    fontSize: 26,
    color: '#4C1D95',
    textAlign: 'center',
    marginBottom: 18,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: {
    width: '48%',
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    alignItems: 'center',
  },
  statValue: { fontFamily: 'PlayfairBold', fontSize: 22, color: '#6D28D9' },
  statLabel: { fontFamily: 'Playfair', fontSize: 13, color: '#6B7280' },
  authCard: {
    marginTop: height * 0.22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    padding: 24,
    gap: 14,
  },
  authTitle: {
    fontFamily: 'PlayfairBold',
    fontSize: 26,
    textAlign: 'center',
    color: '#4C1D95',
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontFamily: 'PlayfairBold', fontSize: 16 },
  whiteBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center' },
  whiteText: { color: '#4C1D95', fontFamily: 'PlayfairBold', fontSize: 16 },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    padding: 16,
    borderRadius: 16,
  },
  outlineText: { color: '#7C3AED', fontFamily: 'PlayfairBold', fontSize: 16 },
  bottom: { marginBottom: 40 },
  nextBtn: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  nextText: { fontFamily: 'PlayfairBold', fontSize: 16, color: '#4C1D95' },
  dots: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#DDD6FE',
  },
  dotActive: { width: 20, backgroundColor: '#7C3AED' },
});
