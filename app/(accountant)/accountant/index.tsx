import { View, Text, StyleSheet } from 'react-native';
import { RoleGuard } from '@/lib/role-guard';
import { useSession } from '@/hooks/useSession';
import { useLogout } from '@/hooks/useLogout';
import { Button } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

function AccountantDashboardContent() {
  const { school_code } = useSession();
  const performLogout = useLogout();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accountant Dashboard</Text>
      <Text style={styles.subtitle}>School: {school_code ?? '—'}</Text>
      <Button title="Logout" variant="outline" onPress={performLogout} />
    </View>
  );
}

export default function AccountantDashboardScreen() {
  return (
    <RoleGuard allowedRoles={['accountant']} redirectTo="/accountant/login">
      <AccountantDashboardContent />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing[6], backgroundColor: colors.background.app },
  title: { ...textStyles.h2, color: colors.text.primary, marginBottom: spacing[1] },
  subtitle: { ...textStyles.body, color: colors.text.secondary, marginBottom: spacing[6] },
});
