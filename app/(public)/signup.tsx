import { View, Text, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LandingPillButton } from '@/components/ui/LandingPillButton';
import { areaPalettes } from '@/theme/areaPalettes';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

const palette = areaPalettes.landing;

export default function SignUpScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: palette.primary }]}>Sign Up</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          School signup is handled by your institution. Contact your school admin for access.
        </Text>
        <View style={styles.actions}>
          <Link href="/login" asChild>
            <LandingPillButton title="Go to Login" variant="primary" />
          </Link>
          <LandingPillButton title="Back" variant="outline" onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing[6], justifyContent: 'center' },
  title: { ...textStyles.h1, marginBottom: spacing[2], textAlign: 'center' },
  subtitle: { ...textStyles.body, marginBottom: spacing[8], textAlign: 'center' },
  actions: { gap: spacing[3] },
});
