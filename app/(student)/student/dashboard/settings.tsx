/**
 * Settings: local/app settings toggles (notifications, theme). No APIs.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useStudent } from '@/lib/student-context';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const STUDENT_BLUE = '#2563EB';

export default function StudentSettingsScreen() {
  const router = useRouter();
  const { path } = useStudent();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: STUDENT_BLUE }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={notifications ? STUDENT_BLUE : '#9CA3AF'}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dark mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={darkMode ? STUDENT_BLUE : '#9CA3AF'}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push(path('change-password') as never)}
          >
            <Text style={styles.linkText}>Change Password</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F9FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 56,
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  section: { marginBottom: spacing[6] },
  sectionTitle: { ...textStyles.h4, color: '#111827', marginBottom: spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 44,
  },
  rowLabel: { ...textStyles.body, color: '#111827' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 44,
  },
  linkText: { ...textStyles.body, color: '#111827' },
  chevron: { fontSize: 20, color: '#9CA3AF' },
});
