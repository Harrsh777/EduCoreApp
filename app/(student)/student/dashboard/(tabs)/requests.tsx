/**
 * Requests tab: Apply for Leave, My Leaves, Certificate Management.
 */

import { useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useStudent } from '@/lib/student-context';
import { SectionCard, ModuleButton } from '@/components/student-dashboard';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { STUDENT_DASHBOARD_SECTIONS } from '@/constants/studentDashboardMenu';
import { spacing } from '@/theme/spacing';

const { colors, screenRootWeb } = studentDashboardTheme;
const REQUESTS_SECTION = STUDENT_DASHBOARD_SECTIONS.find((s) => s.id === 'requests');

export default function RequestsTabScreen() {
  const router = useRouter();
  const { path } = useStudent();

  if (!REQUESTS_SECTION) return null;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title={REQUESTS_SECTION.title}>
          {REQUESTS_SECTION.modules.map((mod) => (
            <ModuleButton
              key={mod.id}
              icon={mod.icon}
              label={mod.label}
              onPress={() => router.push(path(mod.path) as never)}
            />
          ))}
        </SectionCard>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryBg, ...screenRootWeb },
  scroll: { flex: 1 },
  content: { paddingTop: spacing[6], paddingBottom: spacing[16] },
});
