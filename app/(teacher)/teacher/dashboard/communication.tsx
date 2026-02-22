/**
 * Communication: notice list, priority badge, category tag, tap → full detail. GET /api/communication/notices.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { communicationService } from '@/services/communication.service';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

type Notice = { id?: string; title?: string; content?: string; category?: string; priority?: string; created_at?: string };

export default function TeacherCommunicationScreen() {
  const { schoolCode } = useTeacher();
  const [detailNotice, setDetailNotice] = useState<Notice | null>(null);
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['communication', 'notices', schoolCode],
    queryFn: () => communicationService.getNotices(schoolCode, { status: 'Active', limit: 50 }).then((r) => (r as { data?: Notice[] })?.data ?? []),
    enabled: Boolean(schoolCode),
  });
  const notices = (Array.isArray(data) ? data : []) as Notice[];
  const priorityColor = (p?: string) => ((p ?? '').toLowerCase() === 'high' ? colors.danger : (p ?? '').toLowerCase() === 'medium' ? colors.warning : colors.textMuted);

  return (
    <View style={styles.root}>
      <AppHeader title="Communication" />
      <ScreenWrapper scroll refreshing={isRefetching} onRefresh={() => refetch()} loading={isLoading && !notices.length} contentContainerStyle={styles.content}>
        {isError ? <View style={styles.centered}><Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed'}</Text></View> : (
          notices.map((n) => (
            <Pressable key={n.id} onPress={() => setDetailNotice(n)}>
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{n.title ?? '—'}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColor(n.priority) + '20' }]}><Text style={[styles.priorityText, { color: priorityColor(n.priority) }]}>{(n.priority ?? 'Normal').toUpperCase()}</Text></View>
                </View>
                {n.category ? <View style={styles.categoryTag}><Text style={styles.categoryText}>{n.category}</Text></View> : null}
                <Text style={styles.cardPreview} numberOfLines={2}>{n.content ?? ''}</Text>
                {n.created_at ? <Text style={styles.cardTime}>{new Date(n.created_at).toLocaleDateString()}</Text> : null}
              </Card>
            </Pressable>
          ))
        )}
        {notices.length === 0 && !isLoading && !isError && <Text style={styles.empty}>No notices.</Text>}
        <View style={styles.bottomPad} />
      </ScreenWrapper>
      <Modal visible={!!detailNotice} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>{detailNotice?.title ?? '—'}</Text>
              <Pressable onPress={() => setDetailNotice(null)}><Text style={styles.modalCloseText}>Close</Text></Pressable>
            </View>
            <ScrollView style={styles.modalScroll}>
              {detailNotice?.priority ? <Text style={styles.modalMeta}>Priority: {(detailNotice.priority ?? '').toUpperCase()}</Text> : null}
              {detailNotice?.category ? <Text style={styles.modalMeta}>Category: {detailNotice.category}</Text> : null}
              {detailNotice?.created_at ? <Text style={styles.modalMeta}>{new Date(detailNotice.created_at).toLocaleString()}</Text> : null}
              <Text style={styles.modalBody}>{detailNotice?.content ?? '—'}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { marginBottom: s.lg },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s.sm },
  cardTitle: { flex: 1, ...textStyles.body, fontWeight: '600', color: colors.textPrimary },
  cardPreview: { ...textStyles.caption, color: colors.textMuted, marginTop: s.xs },
  cardTime: { ...textStyles.caption, color: colors.textSecondary, marginTop: s.xs },
  priorityBadge: { paddingHorizontal: s.sm, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '700' },
  categoryTag: { alignSelf: 'flex-start', backgroundColor: colors.primaryLight, paddingHorizontal: s.sm, paddingVertical: 2, borderRadius: 8, marginTop: s.xs },
  categoryText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  centered: { flex: 1, padding: s.lg },
  errorText: { ...textStyles.body, color: colors.danger },
  empty: { ...textStyles.body, color: colors.textMuted, textAlign: 'center', marginTop: s.xl },
  bottomPad: { height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: s.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { flex: 1, ...textStyles.h4, color: colors.textPrimary },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  modalScroll: { padding: s.lg },
  modalMeta: { ...textStyles.caption, color: colors.textMuted, marginBottom: s.xs },
  modalBody: { ...textStyles.body, color: colors.textPrimary, marginTop: s.md },
});
