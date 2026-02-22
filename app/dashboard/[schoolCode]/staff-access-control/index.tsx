/**
 * Staff access control: RBAC — staff permissions, roles. Tables: staff, permission_categories, staff_permissions, staff_roles, role_permissions, sub_modules.
 * APIs: GET /api/rbac/staff-permissions, GET /api/roles, GET /api/permissions.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';
import { rbacService } from '@/services/rbac.service';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function StaffAccessControlScreen() {
  const router = useRouter();
  const { schoolCode, path } = useSchoolCode();

  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff', schoolCode],
    queryFn: () => schoolService.getStaff(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: permsData } = useQuery({
    queryKey: ['rbac', 'staff-permissions', schoolCode],
    queryFn: () => rbacService.getStaffPermissions(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const staffList = Array.isArray(staffData) ? staffData : (staffData as { data?: { id: string; name?: string; staff_id?: string }[] })?.data ?? [];

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Staff access control</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Staff permissions" />
        {isLoading && !staffList.length ? (
          <ActivityIndicator size="small" color={INDIGO} style={styles.loader} />
        ) : staffList.length === 0 ? (
          <Text style={styles.empty}>No staff. Add staff in Staff Management.</Text>
        ) : (
          (staffList as { id: string; name?: string; staff_id?: string }[]).map((s) => (
            <Pressable
              key={s.id}
              style={styles.card}
              onPress={() => router.push(path(`staff-access-control/${s.id}`) as never)}
            >
              <Text style={styles.cardTitle}>{s.name ?? s.staff_id ?? s.id}</Text>
              <Text style={styles.cardMeta}>{s.staff_id ?? ''}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing[4],
    borderRadius: 12,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { ...textStyles.body, color: '#111827', fontWeight: '600', flex: 1 },
  cardMeta: { ...textStyles.caption, color: '#6B7280', marginRight: spacing[2] },
  chevron: { fontSize: 20, color: '#9CA3AF' },
});
