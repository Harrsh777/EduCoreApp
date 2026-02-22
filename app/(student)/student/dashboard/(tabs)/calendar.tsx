/**
 * Calendar tab — redirects to academic calendar or shows placeholder.
 */

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { studentDashboardTheme } from '@/theme/studentDashboard';

const { colors, spacing: s } = studentDashboardTheme;

export default function CalendarTabScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Calendar</Text>
      <Pressable
        style={styles.btn}
        onPress={() => router.push('/student/dashboard/calendar/academic' as never)}
      >
        <Text style={styles.btnText}>Academic Calendar</Text>
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
