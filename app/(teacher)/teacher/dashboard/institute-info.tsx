/**
 * Institute Info: school info cards (name, code, address, principal, contact).
 * GET /api/schools/accepted.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { instituteService } from '@/services/institute.service';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

type School = {
  school_name?: string;
  school_code?: string;
  school_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  school_email?: string;
  school_phone?: string;
  principal_name?: string;
};

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function TeacherInstituteInfoScreen() {
  const { schoolCode } = useTeacher();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['schools', 'accepted', schoolCode],
    queryFn: () => instituteService.getAcceptedSchools({ school_code: schoolCode }).then((r) => (r as { data?: School[] })?.data ?? []),
    enabled: Boolean(schoolCode),
  });

  const list = (Array.isArray(data) ? data : (data as { data?: School[] })?.data ?? []) as School[];
  const school = list.find((s) => s.school_code === schoolCode) ?? list[0];

  const addressParts = [
    school?.school_address,
    school?.city,
    school?.state,
    school?.zip_code,
    school?.country,
  ].filter(Boolean);
  const address = addressParts.join(', ');

  return (
    <View style={styles.root}>
      <AppHeader title="Institute Info" />
      <ScreenWrapper scroll loading={isLoading && !school} contentContainerStyle={styles.content}>
        {isError ? (
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load'}</Text>
        ) : school ? (
          <>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>School</Text>
              <InfoRow label="Name" value={school.school_name} />
              <InfoRow label="Code" value={school.school_code} />
              <InfoRow label="Address" value={address || school.school_address} />
            </Card>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Principal & Contact</Text>
              <InfoRow label="Principal" value={school.principal_name} />
              <InfoRow label="Email" value={school.school_email} />
              <InfoRow label="Phone" value={school.school_phone} />
            </Card>
          </>
        ) : (
          <Text style={styles.empty}>No school info found.</Text>
        )}
        <View style={styles.bottomPad} />
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { marginBottom: s.lg },
  cardTitle: { ...textStyles.h4, color: colors.textPrimary, marginBottom: s.md },
  row: { marginBottom: s.sm },
  rowLabel: { ...textStyles.caption, color: colors.textMuted },
  rowValue: { ...textStyles.body, color: colors.textPrimary, marginTop: 2 },
  errorText: { ...textStyles.body, color: colors.danger, padding: s.lg },
  empty: { ...textStyles.body, color: colors.textMuted, padding: s.lg },
  bottomPad: { height: 40 },
});
