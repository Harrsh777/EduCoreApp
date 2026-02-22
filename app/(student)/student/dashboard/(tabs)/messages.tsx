/**
 * Messages tab — placeholder or redirect to communication.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { studentDashboardTheme } from '@/theme/studentDashboard';

const { colors, spacing: s } = studentDashboardTheme;

export default function MessagesTabScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Messages</Text>
      <Pressable
        style={styles.btn}
        onPress={() => router.push('/student/dashboard/communication' as never)}
      >
        <Text style={styles.btnText}>Open Communication</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundStart, padding: s.xl },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: s.lg },
  btn: {
    paddingVertical: s.lg,
    paddingHorizontal: s.xl,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  btnText: { fontSize: 16, fontWeight: '600', color: colors.primary },
});
