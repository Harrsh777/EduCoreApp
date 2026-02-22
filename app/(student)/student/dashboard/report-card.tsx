/**
 * Report Card: current report card card + past semesters list.
 * API: GET /api/marks/report-card/student; view/download via GET /api/marks/report-card/:id
 * UI: header with description + year pill, main card (Annual Report, View/Download), Past Semesters list.
 */

import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStudent } from '@/lib/student-context';
import { env } from '@/lib/env';
import { getStudentByAdmissionNo } from '@/services/school.service';
import { studentService } from '@/services/student.service';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { textStyles } from '@/theme/typography';

const { colors, spacing: s, cardRadius, webSolid } = studentDashboardTheme;

type ReportCardItem = {
  id: string;
  title?: string;
  name?: string;
  academic_year?: string;
  year?: number;
  sent_at?: string;
  date_sent?: string;
  created_at?: string;
  status?: string;
  [k: string]: unknown;
};

function normalizeList(raw: unknown): ReportCardItem[] {
  const arr = Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? [];
  return (arr as ReportCardItem[]).map((item) => ({
    ...item,
    title: item.title ?? item.name ?? 'Report Card',
    year: item.year ?? (item.academic_year ? parseInt(String(item.academic_year).slice(0, 4), 10) : undefined),
    sent_at: item.sent_at ?? item.date_sent ?? item.created_at,
  }));
}

function formatSentDate(str: string | undefined): string {
  if (!str) return '';
  try {
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function StudentReportCardScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const canFetch = Boolean(schoolCode && (studentId || (env.USE_SUPABASE_DASHBOARD && student?.admission_no)));

  const { data: rawData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'report-cards', schoolCode, studentId, student?.admission_no],
    queryFn: async (): Promise<unknown> => {
      let effectiveId = studentId;
      if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
        try {
          const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
          const row = (r as { data?: { id?: string } })?.data;
          if (row?.id) effectiveId = String(row.id);
        } catch {
          // keep studentId
        }
      }
      if (!effectiveId) return [];
      const r = await studentService.getReportCardList({ school_code: schoolCode, student_id: effectiveId });
      return (r as { data?: unknown }).data ?? r;
    },
    enabled: canFetch,
  });

  const list = useMemo(() => normalizeList(rawData), [rawData]);
  const currentReport = list[0] ?? null;
  const pastReports = list.slice(1);
  const displayYear = useMemo(() => {
    const first = list[0];
    if (!first) return new Date().getFullYear();
    const y = first.year ?? (first.academic_year ? parseInt(String(first.academic_year).slice(0, 4), 10) : undefined);
    return y != null && !Number.isNaN(y) ? y : new Date().getFullYear();
  }, [list]);

  const openReport = (id: string, action: 'view' | 'download') => {
    const base = env.API_BASE_URL || '';
    const url = `${base}/api/marks/report-card/${id}?student_id=${studentId}&school_code=${schoolCode}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank', action === 'download' ? 'noopener' : undefined);
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Report Card</Text>
          <Text style={styles.description}>View or download your academic performance reports here.</Text>
        </View>
        <View style={styles.yearPill}>
          <Text style={styles.yearPillText}>{displayYear}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : !currentReport ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No report cards yet</Text>
            <Text style={styles.emptySubtitle}>Your report cards will appear here once published by the school.</Text>
          </View>
        ) : (
          <>
            {/* Current report card — main card */}
            <View style={styles.mainCard}>
              <View style={styles.mainCardTop}>
                <View style={styles.docIconWrap}>
                  <Ionicons name="document-text" size={28} color={colors.primary} />
                </View>
                <View style={styles.mainCardMeta}>
                  <View style={styles.titleRow}>
                    <Text style={styles.reportTitle}>
                      {currentReport.title ?? 'Annual Report'} {currentReport.year ?? currentReport.academic_year ?? ''}
                    </Text>
                    <View style={styles.availableBadge}>
                      <View style={styles.availableDot} />
                      <Text style={styles.availableText}>AVAILABLE</Text>
                    </View>
                  </View>
                  {currentReport.sent_at && (
                    <Text style={styles.sentDate}>Sent on {formatSentDate(currentReport.sent_at)}</Text>
                  )}
                </View>
              </View>
              <View style={styles.previewBars}>
                <View style={[styles.previewBar, styles.previewBar1]} />
                <View style={[styles.previewBar, styles.previewBar2]} />
                <View style={[styles.previewBar, styles.previewBar3]} />
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.viewBtn}
                  onPress={() => openReport(currentReport.id, 'view')}
                >
                  <Ionicons name="eye-outline" size={20} color={colors.textPrimary} />
                  <Text style={styles.viewBtnText}>View</Text>
                </Pressable>
                <Pressable
                  style={styles.downloadBtn}
                  onPress={() => openReport(currentReport.id, 'download')}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.downloadBtnText}>Download</Text>
                </Pressable>
              </View>
            </View>

            {/* Past Semesters */}
            {pastReports.length > 0 && (
              <View style={styles.pastSection}>
                <Text style={styles.pastSectionTitle}>PAST SEMESTERS</Text>
                {pastReports.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.pastRow}
                    onPress={() => openReport(item.id, 'view')}
                  >
                    <View style={styles.pastRowIcon}>
                      <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.pastRowLabel}>
                      {item.title ?? 'Report'} {item.year ?? item.academic_year ?? ''}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundStart },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: s.lg,
    paddingTop: s.md,
    paddingBottom: s.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: webSolid.borderCard,
  },
  backBtn: { padding: s.sm, marginRight: s.sm, marginTop: 2 },
  headerCenter: { flex: 1, minWidth: 0 },
  title: { ...textStyles.h4, color: colors.textPrimary },
  description: { ...textStyles.caption, color: colors.textSecondary, marginTop: 4 },
  yearPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: s.md,
    paddingVertical: 6,
    borderRadius: 10,
  },
  yearPillText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  scroll: { flex: 1 },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  loader: { marginVertical: s['2xl'] },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: cardRadius,
    padding: s['3xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: webSolid.borderCard,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: webSolid.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.lg,
  },
  emptyTitle: { ...textStyles.h4, color: colors.textPrimary },
  emptySubtitle: { ...textStyles.body, color: colors.textSecondary, marginTop: s.sm, textAlign: 'center' },

  mainCard: {
    backgroundColor: colors.surface,
    borderRadius: cardRadius,
    padding: s.xl,
    borderWidth: 1,
    borderColor: webSolid.borderCard,
    marginBottom: s['2xl'],
  },
  mainCardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  docIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s.lg,
  },
  mainCardMeta: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: s.sm },
  reportTitle: { ...textStyles.h4, color: colors.textPrimary },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  availableText: { fontSize: 11, fontWeight: '600', color: colors.success },
  sentDate: { ...textStyles.caption, color: colors.textSecondary, marginTop: 4 },
  previewBars: { marginTop: s.xl, marginBottom: s.lg },
  previewBar: { height: 6, borderRadius: 3, backgroundColor: webSolid.borderSubtle, marginBottom: 8 },
  previewBar1: { width: '100%' },
  previewBar2: { width: '85%' },
  previewBar3: { width: '70%', marginBottom: 0 },
  actions: { flexDirection: 'row', gap: s.md },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: webSolid.borderCard,
    gap: s.sm,
  },
  viewBtnText: { ...textStyles.body, fontWeight: '600', color: colors.textPrimary },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: s.sm,
  },
  downloadBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  pastSection: { marginTop: s.lg },
  pastSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: s.md,
  },
  pastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: webSolid.borderSubtle,
    paddingVertical: s.lg,
    paddingHorizontal: s.lg,
    borderRadius: 12,
    marginBottom: s.sm,
    gap: s.md,
  },
  pastRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastRowLabel: { flex: 1, ...textStyles.body, fontWeight: '600', color: colors.textPrimary },
  bottomPad: { height: 80 },
});
