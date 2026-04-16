/**
 * Academics tab: merged menu = filtered teacherBaseItems + dynamic from GET /api/staff/[id]/menu (deduped).
 * Matches STAFF_DASHBOARD_AND_MOBILE_API: class teacher filter, permission filter, then dynamic modules from role.
 */

import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTeacher } from '@/lib/teacher-context';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { getMergedTeacherMenu } from '@/constants/teacherDashboardMenu';
import { textStyles } from '@/theme/typography';

const { colors, spacing: s, cardRadius } = teacherDashboardTheme;

export default function TeacherAcademicsScreen() {
  const router = useRouter();
  const { path, hasPermission, isClassTeacher, hasTeachingAssignments, staffMenuModules } = useTeacher();

  const mergedSections = useMemo(
    () =>
      getMergedTeacherMenu({
        staffMenuModules,
        isClassTeacher,
        hasTeachingAssignments,
        hasPermission,
        path,
      }),
    [staffMenuModules, isClassTeacher, hasTeachingAssignments, hasPermission, path]
  );

  const handleModule = (route: string) => {
    if (!route) return;
    router.push(route as never);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Academics</Text>
        <Text style={styles.subtitle}>All modules and submodules</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mergedSections.map((section) => (
          <View key={section.sectionId} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.sectionTitle}</Text>
            <View style={styles.card}>
              {section.items.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.row}
                  onPress={() => handleModule(item.route)}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon} size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundStart },
  header: { paddingHorizontal: s.lg, paddingVertical: s.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...textStyles.h3, color: colors.textPrimary },
  subtitle: { ...textStyles.caption, color: colors.textSecondary, marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  section: { marginBottom: s.xl },
  sectionTitle: { ...textStyles.body, fontWeight: '700', color: colors.textSecondary, marginBottom: s.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: colors.surface, borderRadius: cardRadius, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.lg,
    paddingHorizontal: s.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: s.md,
  },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, ...textStyles.body, fontWeight: '500', color: colors.textPrimary },
  bottomPad: { height: 80 },
});
