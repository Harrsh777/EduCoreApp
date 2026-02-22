/**
 * Staff [staffId]: permission matrix. GET /api/rbac/staff-permissions/[staffId], PATCH for staff permissions.
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { rbacService } from '@/services/rbac.service';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function StaffPermissionScreen() {
  const router = useRouter();
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const { schoolCode } = useSchoolCode();

  const { data, isLoading } = useQuery({
    queryKey: ['rbac', 'staff-permissions', staffId, schoolCode],
    queryFn: () => rbacService.getStaffPermissionsByStaff(schoolCode, staffId ?? '').then((r) => r.data),
    enabled: Boolean(schoolCode && staffId),
  });

  const permissions = (data as { permissions?: unknown[]; data?: unknown[] })?.permissions ?? (data as { data?: unknown[] })?.data ?? [];

  if (!schoolCode || !staffId) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Staff {staffId}</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Permissions" />
        {isLoading ? (
          <ActivityIndicator size="small" color={INDIGO} style={styles.loader} />
        ) : Array.isArray(permissions) && permissions.length > 0 ? (
          (permissions as { id?: string; name?: string; key?: string }[]).map((p, i) => (
            <View key={p.id ?? i} style={styles.row}>
              <Text style={styles.rowText}>{p.name ?? p.key ?? p.id ?? '—'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No permissions or edit in web app. PATCH /api/rbac/staff-permissions/[staffId] to update.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
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
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  loader: { marginVertical: spacing[4] },
  empty: { ...textStyles.bodySm, color: '#6B7280' },
  row: { paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowText: { ...textStyles.body, color: '#111827' },
});
