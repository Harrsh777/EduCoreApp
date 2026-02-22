/**
 * Premium Parent Information Screen
 * Displays father, mother, guardian and address from students table (Supabase).
 * Clean iOS style — White + Soft Blue Accent
 */

import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useStudent } from '@/lib/student-context';
import { getStudentByAdmissionNo } from '@/services/school.service';
import { studentService } from '@/services/student.service';

const PRIMARY = '#2B6CEE';
const BG = '#FFFFFF';
const TEXT_PRIMARY = '#0F172A';
const TEXT_SECONDARY = '#64748B';
const BORDER_LIGHT = '#F1F5F9';

/** Normalize API/context to flat snake_case (Supabase columns) */
function normalizeParentFields(raw: Record<string, unknown> | null | undefined): Record<string, string | undefined> {
  if (!raw || typeof raw !== 'object') return {};
  const get = (snake: string, camel: string) =>
    (raw[snake] ?? raw[camel]) != null ? String(raw[snake] ?? raw[camel]).trim() : undefined;
  return {
    father_name: get('father_name', 'fatherName'),
    father_occupation: get('father_occupation', 'fatherOccupation'),
    father_contact: get('father_contact', 'fatherContact'),
    mother_name: get('mother_name', 'motherName'),
    mother_occupation: get('mother_occupation', 'motherOccupation'),
    mother_contact: get('mother_contact', 'motherContact'),
    parent_name: get('parent_name', 'parentName'),
    parent_phone: get('parent_phone', 'parentPhone'),
    parent_email: get('parent_email', 'parentEmail'),
    address: get('address', 'address'),
    city: get('city', 'city'),
    state: get('state', 'state'),
    pincode: raw.pincode != null ? String(raw.pincode) : undefined,
    landmark: get('landmark', 'landmark'),
    staff_relation: get('staff_relation', 'staffRelation'),
  };
}

function hasAnyParentData(s: Record<string, string | undefined>): boolean {
  return Boolean(
    s.father_name || s.father_contact || s.father_occupation ||
    s.mother_name || s.mother_contact || s.mother_occupation ||
    s.parent_name || s.parent_phone || s.parent_email || s.staff_relation ||
    s.address || s.city || s.state || s.pincode || s.landmark
  );
}

export default function StudentParentScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const admissionNo = student?.admission_no ?? '';

  const { data: byIdData, isLoading: loadingById, refetch: refetchById, isRefetching } = useQuery({
    queryKey: ['student-full', schoolCode, studentId],
    queryFn: async (): Promise<Record<string, unknown> | null> => {
      const r = await studentService.getById(studentId, schoolCode);
      const raw = (r as { data?: { data?: Record<string, unknown>; parent_name?: string } })?.data;
      const inner = raw && typeof raw === 'object' && (raw as { data?: unknown }).data != null
        ? (raw as { data: Record<string, unknown> }).data
        : raw;
      return (inner && typeof inner === 'object' ? inner : null) as Record<string, unknown> | null;
    },
    enabled: Boolean(schoolCode && studentId),
  });

  const { data: byAdmissionData, refetch: refetchByAdmission } = useQuery({
    queryKey: ['student-by-admission', schoolCode, admissionNo],
    queryFn: async (): Promise<Record<string, unknown> | null> => {
      const r = await getStudentByAdmissionNo(schoolCode, admissionNo);
      const row = (r as { data?: Record<string, unknown> })?.data;
      return (row && typeof row === 'object' ? row : null) as Record<string, unknown> | null;
    },
    enabled: Boolean(schoolCode && admissionNo),
  });

  const s = useMemo(
    () =>
      normalizeParentFields({
        ...(student ?? {}),
        ...(byIdData ?? {}),
        ...(byAdmissionData ?? {}),
      } as Record<string, unknown>),
    [student, byIdData, byAdmissionData]
  );

  const refetch = useCallback(() => {
    refetchById();
    refetchByAdmission();
  }, [refetchById, refetchByAdmission]);

  const isLoading = loadingById;

  const openPhone = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const openEmail = (email?: string) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Parent Info</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={PRIMARY}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={PRIMARY} />
        ) : (
          <>
            {/* Father Section */}
            {(s.father_name || s.father_contact || s.father_occupation) && (
              <>
                <Text style={styles.sectionTitle}>Father</Text>
                <InfoCard label="Name" value={s.father_name} />
                <InfoCard
                  label="Contact"
                  value={s.father_contact}
                  action="Call"
                  onPress={() => openPhone(s.father_contact)}
                />
                <InfoCard label="Occupation" value={s.father_occupation} />
              </>
            )}

            {/* Mother Section */}
            {(s.mother_name || s.mother_contact || s.mother_occupation) && (
              <>
                <Text style={styles.sectionTitle}>Mother</Text>
                <InfoCard label="Name" value={s.mother_name} />
                <InfoCard
                  label="Contact"
                  value={s.mother_contact}
                  action="Call"
                  onPress={() => openPhone(s.mother_contact)}
                />
                <InfoCard label="Occupation" value={s.mother_occupation} />
              </>
            )}

            {/* Guardian / General Parent */}
            {(s.parent_name || s.parent_phone || s.parent_email || s.staff_relation) && (
              <>
                <Text style={styles.sectionTitle}>Guardian</Text>
                <InfoCard label="Name" value={s.parent_name} />
                <InfoCard
                  label="Phone"
                  value={s.parent_phone}
                  action="Call"
                  onPress={() => openPhone(s.parent_phone)}
                />
                <InfoCard
                  label="Email"
                  value={s.parent_email}
                  action="Email"
                  onPress={() => openEmail(s.parent_email)}
                />
                <InfoCard label="Relation to staff" value={s.staff_relation} />
              </>
            )}

            {/* Address Section */}
            {(s.address || s.city || s.state || s.pincode || s.landmark) && (
              <>
                <Text style={styles.sectionTitle}>Address</Text>
                <InfoCard
                  label="Home Address"
                  value={[s.address, s.landmark].filter(Boolean).join(' · ') || undefined}
                />
                <InfoCard
                  label="City, State & PIN"
                  value={[s.city, s.state, s.pincode].filter(Boolean).join(', ') || undefined}
                />
              </>
            )}

            {/* Empty state when no parent data */}
            {!hasAnyParentData(s) && !isLoading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No parent details</Text>
                <Text style={styles.emptyText}>
                  Father, mother, guardian and address are maintained by the school. Ask the front office to update records.
                </Text>
              </View>
            )}

            {/* Info Banner */}
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Contact details are maintained by school administration.
                Please contact the front office for corrections.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoCard({
  label,
  value,
  action,
  onPress,
}: {
  label: string;
  value?: string;
  action?: string;
  onPress?: () => void;
}) {
  if (!value) return null;

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
      {action && onPress && (
        <Pressable onPress={onPress}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  back: {
    fontSize: 22,
    color: PRIMARY,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },

  cardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginTop: 4,
  },

  action: {
    color: PRIMARY,
    fontWeight: '600',
  },

  banner: {
    marginTop: 30,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },

  bannerText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    lineHeight: 18,
  },

  emptyState: {
    marginTop: 32,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});