/**
 * Settings: profile form (name, email, phone), profile photo upload, link to Change Password.
 * GET /api/staff/:teacherId, PATCH /api/staff/:teacherId, GET /api/staff/photos/self.
 */

import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { schoolService } from '@/services/school.service';
import { useToastStore } from '@/lib/toast';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, PrimaryButton, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

function staffPhotoUrlFromResponse(resData: unknown): string | null {
  const body = resData as { data?: unknown } | null | undefined;
  const inner = body != null && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : body;
  if (!inner || typeof inner !== 'object') return null;
  const o = inner as Record<string, unknown>;
  const u = o.url ?? o.photo_url ?? o.signed_url;
  return typeof u === 'string' && u.trim() ? u.trim() : null;
}

export default function TeacherSettingsScreen() {
  const router = useRouter();
  const { schoolCode, teacher, path } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const staffId = teacher?.staff_id ?? teacher?.id ?? '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const { data: staffData } = useQuery({
    queryKey: ['staff', 'self', schoolCode, staffId],
    queryFn: () => schoolService.getStaffById(schoolCode, staffId).then((r) => (r as { data?: { name?: string; email?: string; phone?: string } })?.data),
    enabled: Boolean(schoolCode && staffId),
  });

  const { data: photoUrl } = useQuery({
    queryKey: ['staff', 'photo', 'self', schoolCode, staffId],
    queryFn: () =>
      schoolService.getStaffPhotoSelf(schoolCode, staffId).then((r) => staffPhotoUrlFromResponse((r as { data?: unknown }).data)),
    enabled: Boolean(schoolCode && staffId),
  });

  useEffect(() => {
    const d = staffData as { name?: string; email?: string; phone?: string } | undefined;
    if (d) {
      setName(d.name ?? '');
      setEmail(d.email ?? '');
      setPhone(d.phone ?? '');
    } else if (teacher) {
      setName((teacher.full_name as string) ?? '');
    }
  }, [staffData, teacher]);

  const updateMutation = useMutation({
    mutationFn: () =>
      schoolService.updateStaff(schoolCode, staffId, { name: name.trim() || undefined, email: email.trim() || undefined, phone: phone.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'self', schoolCode, staffId] });
      queryClient.invalidateQueries({ queryKey: ['staff', 'photo', 'self', schoolCode, staffId] });
      showToast('Profile updated', 'success');
    },
    onError: (err: Error) => showToast(err?.message ?? 'Update failed', 'error'),
  });

  return (
    <View style={styles.root}>
      <AppHeader title="Settings" />
      <ScreenWrapper scroll contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.textMuted} />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
          <View style={styles.photoRow}>
            <Text style={styles.label}>Profile photo</Text>
            <View style={styles.photoPreviewRow}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.photoThumb} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>{(name || '?').trim().charAt(0).toUpperCase() || '?'}</Text>
                </View>
              )}
              <Text style={styles.photoHint}>Loaded from your school account (GET /api/staff/photos/self).</Text>
            </View>
          </View>
          <View style={styles.saveBtn}><PrimaryButton title="Save changes" onPress={() => updateMutation.mutate()} loading={updateMutation.isPending} disabled={updateMutation.isPending} /></View>
        </Card>
        <Card style={styles.card}>
          <Pressable style={styles.linkRow} onPress={() => router.push(path('change-password') as never)}>
            <Text style={styles.linkLabel}>Change Password</Text>
            <Text style={styles.linkArrow}>→</Text>
          </Pressable>
        </Card>
        <View style={styles.bottomPad} />
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { marginBottom: s.lg },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary, marginBottom: s.md },
  label: { ...textStyles.caption, color: colors.textMuted, marginBottom: s.xs, marginTop: s.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: s.md, paddingVertical: s.sm, fontSize: 14, color: colors.textPrimary, marginBottom: s.xs },
  photoRow: { marginTop: s.md },
  photoPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: s.md, marginTop: s.xs },
  photoThumb: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.border },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: { ...textStyles.h4, color: colors.primaryDark },
  photoHint: { ...textStyles.caption, color: colors.textMuted, flex: 1 },
  saveBtn: { marginTop: s.lg },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: s.sm },
  linkLabel: { ...textStyles.body, fontWeight: '600', color: colors.primary },
  linkArrow: { fontSize: 18, color: colors.primary },
  bottomPad: { height: 40 },
});
