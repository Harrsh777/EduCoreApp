/**
 * Communication tab: redirect to Communication module.
 */

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTeacher } from '@/lib/teacher-context';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';

const { colors, spacing: s } = teacherDashboardTheme;

export default function TeacherCommunicationTabScreen() {
  const router = useRouter();
  const { path } = useTeacher();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Communication</Text>
        <Text style={styles.subtitle}>Messages, notices, and alerts</Text>
      </View>
      <Pressable
        style={styles.card}
        onPress={() => router.push(path('communication') as never)}
      >
        <Ionicons name="chatbubbles" size={48} color={colors.primary} />
        <Text style={styles.cardTitle}>Communication Hub</Text>
        <Text style={styles.cardMeta}>Reach parents and faculty via SMS, Email, or App</Text>
        <Text style={styles.link}>Open Communication →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundStart },
  header: { paddingHorizontal: s.lg, paddingVertical: s.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...textStyles.h3, color: colors.textPrimary },
  subtitle: { ...textStyles.caption, color: colors.textSecondary, marginTop: 4 },
  card: {
    margin: s.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: s['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...textStyles.h4, color: colors.textPrimary, marginTop: s.lg },
  cardMeta: { ...textStyles.body, color: colors.textSecondary, marginTop: s.sm, textAlign: 'center' },
  link: { marginTop: s.lg, fontSize: 14, fontWeight: '600', color: colors.primary },
});
