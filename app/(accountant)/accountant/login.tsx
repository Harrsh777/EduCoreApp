import { View, Text, StyleSheet } from 'react-native';
import { LoginForm } from '@/components/forms';
import { areaPalettes } from '@/theme/areaPalettes';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const palette = areaPalettes.accountant;

export default function AccountantLoginScreen() {
  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.screenTitle, { color: palette.primary }]}>Accountant</Text>
      <Text style={[styles.screenSubtitle, { color: palette.textSecondary }]}>
        Sign in with school code, staff ID and password
      </Text>
      <LoginForm role="accountant" submitLabel="Sign in" palette={palette} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing[8] },
  screenTitle: { ...textStyles.h2, textAlign: 'center', marginBottom: spacing[1] },
  screenSubtitle: { ...textStyles.bodySm, textAlign: 'center', marginBottom: spacing[8], paddingHorizontal: spacing[4] },
});
