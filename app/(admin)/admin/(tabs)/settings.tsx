import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLogout } from '@/hooks/useLogout';
import { SectionHeader, Button } from '@/components/ui';

export default function AdminSettingsScreen() {
  const { spacing, colors: c } = useTheme();
  const logout = useLogout();

  return (
    <View style={[styles.container, { padding: spacing[4] }]}>
      <SectionHeader title="Settings" />
      <View style={[styles.section, { marginTop: spacing[6] }]}>
        <Button title="Logout" variant="outline" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {},
});
