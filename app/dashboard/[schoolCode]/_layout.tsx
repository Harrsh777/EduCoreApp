/**
 * School dashboard layout: RoleGuard, SchoolProvider, Stack only (no sidebar).
 * 3-Level ERP: Level 1 = (tabs) Home, Level 2 = domain/[domainId], Level 3 = module screens.
 * Route: /dashboard/:schoolCode
 */

import { Stack, useLocalSearchParams } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { RoleGuard } from '@/lib/role-guard';
import { SchoolProvider } from '@/lib/school-context';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function DashboardSchoolLayout() {
  const params = useLocalSearchParams<{ schoolCode?: string }>();
  const code = params.schoolCode ?? '';

  if (!code) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={loadingStyles.text}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']} redirectTo="/admin/login">
      <SchoolProvider schoolCode={code}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="domain" options={{ title: 'Domain' }} />
          <Stack.Screen name="institute-info" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="password" />
          <Stack.Screen name="staff-management" />
          <Stack.Screen name="classes" />
          <Stack.Screen name="students" />
          <Stack.Screen name="feedback" />
          <Stack.Screen name="faq" />
          <Stack.Screen name="timetable" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="examinations" />
          <Stack.Screen name="marks" />
          <Stack.Screen name="marks-entry" />
          <Stack.Screen name="fees" />
          <Stack.Screen name="library" />
          <Stack.Screen name="transport" />
          <Stack.Screen name="leave" />
          <Stack.Screen name="communication" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="report-card" />
          <Stack.Screen name="gallery" />
          <Stack.Screen name="certificates" />
          <Stack.Screen name="homework" />
          <Stack.Screen name="expense-income" />
          <Stack.Screen name="front-office" />
          <Stack.Screen name="gate-pass" />
          <Stack.Screen name="visitor-management" />
          <Stack.Screen name="copy-checking" />
          <Stack.Screen name="attendance" />
          <Stack.Screen name="staff-access-control" />
          <Stack.Screen name="[...slug]" options={{ title: 'Module' }} />
        </Stack>
      </SchoolProvider>
    </RoleGuard>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  text: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
});
