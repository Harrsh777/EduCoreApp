/**
 * Digital Diary: matches provided UI/UX — summary tags, type/status filters, entry cards with attachments.
 * API: diaryService.getDiary (class_id); optional getDiaryStats. Backend unchanged.
 */

import { useRouter } from 'expo-router';
import React, { useMemo, useState, useCallback } from 'react';
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
import { diaryService } from '@/services/diary.service';
import { schoolService } from '@/services/school.service';

// Match image colour scheme
const PRIMARY_BLUE = '#6D9CFE';
const TITLE_DARK = '#1E1E1E';
const BODY_DARK = '#333333';
const GREY_MID = '#5F6368';
const GREY_MUTED = '#888888';
const GREY_LIGHT = '#CCCCCC';
const TAG_BG = '#F0F0F0';
const CARD_BG = '#FFFFFF';
const ROOT_BG = '#FFFFFF';
const CARD_SHADOW = { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 };

const TYPE_OPTIONS = ['All', 'Homework', 'Assignment', 'Announcements'] as const;
type TypeFilter = (typeof TYPE_OPTIONS)[number];

function formatDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  } catch {
    return d;
  }
}

function formatFileSize(bytes?: number): string {
  if (bytes == null || bytes === 0) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${Math.round(kb)} KB`;
}

type DiaryEntry = {
  id?: string;
  title?: string;
  content?: string;
  description?: string;
  date?: string;
  created_at?: string;
  subject?: string;
  type?: string;
  is_read?: boolean;
  created_by?: string;
  sender?: string;
  target_class?: string;
  class_name?: string;
  attachments?: { id?: string; file_name?: string; file_url?: string; file_size?: number; url?: string }[];
  attachment?: { file_name?: string; file_url?: string; file_size?: number };
};

function normalizeEntry(raw: Record<string, unknown>): DiaryEntry {
  const type = String(raw.type ?? raw.entry_type ?? 'homework').toLowerCase();
  const entry: DiaryEntry = {
    id: raw.id != null ? String(raw.id) : undefined,
    title: String(raw.title ?? 'Untitled').trim() || 'Untitled',
    content: [raw.content, raw.description, raw.body].find((x) => typeof x === 'string') as string | undefined,
    description: raw.description as string | undefined,
    date: (raw.date ?? raw.created_at ?? raw.entry_date) as string | undefined,
    created_at: raw.created_at as string | undefined,
    subject: raw.subject as string | undefined,
    type: type === 'homework' ? 'Homework' : type === 'assignment' ? 'Assignment' : type === 'announcement' ? 'Announcements' : type,
    is_read: typeof raw.is_read === 'boolean' ? raw.is_read : typeof raw.read === 'boolean' ? raw.read : true,
    created_by: (raw.created_by ?? raw.sender ?? raw.teacher_name) as string | undefined,
    sender: raw.sender as string | undefined,
    target_class: (raw.target_class ?? raw.class_name ?? raw.for_class) as string | undefined,
    class_name: raw.class_name as string | undefined,
  };
  const att = raw.attachments ?? raw.attachment;
  if (Array.isArray(att) && att.length > 0) {
    entry.attachments = att.map((a: Record<string, unknown>) => ({
      id: a.id != null ? String(a.id) : undefined,
      file_name: String(a.file_name ?? a.name ?? a.filename ?? ''),
      file_url: (a.file_url ?? a.url ?? a.file_url) as string | undefined,
      file_size: typeof a.file_size === 'number' ? a.file_size : undefined,
      url: (a.url ?? a.file_url) as string | undefined,
    }));
  } else if (att && typeof att === 'object' && !Array.isArray(att)) {
    const a = att as Record<string, unknown>;
    entry.attachments = [{
      file_name: String(a.file_name ?? a.name ?? a.filename ?? ''),
      file_url: (a.file_url ?? a.url) as string | undefined,
      file_size: a.file_size as number | undefined,
      url: (a.url ?? a.file_url) as string | undefined,
    }];
  }
  return entry;
}

export default function StudentDiaryScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const cls = student?.class ?? '';
  const section = student?.section ?? '';
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [statusFilter, setStatusFilter] = useState<'read' | 'unread'>('read');

  const { data: classesData } = useQuery({
    queryKey: ['classes', schoolCode],
    queryFn: () => schoolService.getClasses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const classesList = (Array.isArray(classesData) ? classesData : (classesData as { data?: { id: string; class?: string; section?: string }[] })?.data ?? []) as { id: string; class?: string; section?: string }[];
  const classId = useMemo(
    () => classesList.find((c) => String(c.class) === String(cls) && String(c.section) === String(section))?.id ?? classesList[0]?.id ?? '',
    [classesList, cls, section]
  );

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['diary', schoolCode, classId],
    queryFn: () => diaryService.getDiary(schoolCode, { class_id: classId }).then((r) => r.data),
    enabled: Boolean(schoolCode && classId),
  });

  const rawList = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
  const entries: DiaryEntry[] = useMemo(
    () => (rawList as Record<string, unknown>[]).map((e) => normalizeEntry(e)),
    [rawList]
  );

  const { total, homeworkCount, unreadCount, filteredEntries } = useMemo(() => {
    const total = entries.length;
    const homeworkCount = entries.filter((e) => (e.type ?? '').toLowerCase() === 'homework').length;
    const unreadCount = entries.filter((e) => !e.is_read).length;
    let list = entries;
    if (typeFilter !== 'All') {
      const match = typeFilter.toLowerCase();
      list = list.filter((e) => (e.type ?? '').toLowerCase() === match);
    }
    if (statusFilter === 'read') list = list.filter((e) => e.is_read);
    else list = list.filter((e) => !e.is_read);
    return { total, homeworkCount, unreadCount, filteredEntries: list };
  }, [entries, typeFilter, statusFilter]);

  const openAttachment = useCallback((url?: string) => {
    if (url && (url.startsWith('http') || url.startsWith('https'))) Linking.openURL(url);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={TITLE_DARK} />
        </Pressable>
        <Text style={styles.headerTitle}>Digital Diary</Text>
        <View style={styles.readBadge}>
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={PRIMARY_BLUE} />
        }
      >
        {/* Summary tags */}
        <View style={styles.summaryRow}>
          <View style={styles.tag}><Text style={styles.tagText}>TOTAL: {total}</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>HOMEWORK: {homeworkCount}</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>UNREAD: {unreadCount}</Text></View>
        </View>

        {/* Type filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll} contentContainerStyle={styles.typeRow}>
          {TYPE_OPTIONS.map((t) => (
            <Pressable
              key={t}
              style={[styles.typeChip, typeFilter === t && styles.typeChipActive]}
              onPress={() => setTypeFilter(t)}
            >
              <Text style={[styles.typeChipText, typeFilter === t && styles.typeChipTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Status tabs: READ | UNREAD */}
        <View style={styles.statusRow}>
          <Pressable style={styles.statusTab} onPress={() => setStatusFilter('read')}>
            <Text style={[styles.statusTabText, statusFilter === 'read' && styles.statusTabTextActive]}>READ</Text>
            {statusFilter === 'read' && <View style={styles.statusUnderline} />}
          </Pressable>
          <Pressable style={styles.statusTab} onPress={() => setStatusFilter('unread')}>
            <Text style={[styles.statusTabText, statusFilter === 'unread' && styles.statusTabTextActive]}>UNREAD</Text>
            {statusFilter === 'unread' && <View style={styles.statusUnderline} />}
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={PRIMARY_BLUE} style={styles.loader} />
        ) : filteredEntries.length === 0 ? (
          <Text style={styles.emptyHint}>
            {entries.length === 0 ? 'No diary entries for your class.' : 'No entries match the selected filters.'}
          </Text>
        ) : (
          <>
            {filteredEntries.map((e, i) => (
              <View key={e.id ?? i} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTypeRow}>
                    <View style={styles.typeDot} />
                    <Text style={styles.cardType}>{e.type ?? 'HOMEWORK'}</Text>
                  </View>
                  <Text style={styles.cardDate}>{e.date ? formatDate(e.date) : '—'}</Text>
                </View>
                <Text style={styles.cardTitle}>{e.title}</Text>
                <Text style={styles.cardMeta}>
                  By {e.created_by ?? e.sender ?? 'Unknown'} • For Class {(e.target_class ?? e.class_name ?? cls) || '—'}
                </Text>
                {(e.content ?? e.description) ? (
                  <Text style={styles.cardContent}>{e.content ?? e.description}</Text>
                ) : null}
                {e.attachments && e.attachments.length > 0 ? (
                  <View style={styles.attachRow}>
                    <Ionicons name="document-text-outline" size={20} color={GREY_MUTED} />
                    <View style={styles.attachInfo}>
                      <Text style={styles.attachName} numberOfLines={1}>{e.attachments[0].file_name || 'Attachment'}</Text>
                      <Text style={styles.attachSize}>{formatFileSize(e.attachments[0].file_size)}</Text>
                    </View>
                    <Pressable
                      style={styles.downloadBtn}
                      onPress={() => openAttachment(e.attachments![0].file_url ?? e.attachments![0].url)}
                    >
                      <Text style={styles.downloadText}>Download</Text>
                      <Ionicons name="arrow-down-circle-outline" size={18} color={PRIMARY_BLUE} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
            <Text style={styles.endLabel}>END OF ENTRIES</Text>
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ROOT_BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: TAG_BG,
    minHeight: 56,
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: TITLE_DARK },
  readBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tag: {
    backgroundColor: TAG_BG,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  tagText: { fontSize: 13, color: GREY_MID, fontWeight: '500' },
  typeScroll: { marginHorizontal: -20 },
  typeRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: TAG_BG,
  },
  typeChipActive: { backgroundColor: PRIMARY_BLUE },
  typeChipText: { fontSize: 14, color: GREY_MID, fontWeight: '600' },
  typeChipTextActive: { color: '#FFFFFF' },
  statusRow: { flexDirection: 'row', marginBottom: 20, gap: 24 },
  statusTab: { position: 'relative', paddingVertical: 6 },
  statusTabText: { fontSize: 15, color: GREY_MUTED, fontWeight: '600' },
  statusTabTextActive: { color: TITLE_DARK },
  statusUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 1,
  },
  loader: { marginVertical: 24 },
  emptyHint: { fontSize: 15, color: GREY_MUTED, textAlign: 'center', marginTop: 24 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...CARD_SHADOW,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY_BLUE },
  cardType: { fontSize: 12, fontWeight: '600', color: PRIMARY_BLUE },
  cardDate: { fontSize: 12, color: GREY_MUTED },
  cardTitle: { fontSize: 18, fontWeight: '700', color: TITLE_DARK, marginBottom: 6 },
  cardMeta: { fontSize: 14, color: GREY_MUTED, marginBottom: 12 },
  cardContent: { fontSize: 15, color: BODY_DARK, lineHeight: 22, marginBottom: 14 },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TAG_BG,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  attachInfo: { flex: 1, minWidth: 0 },
  attachName: { fontSize: 14, color: TITLE_DARK, fontWeight: '500' },
  attachSize: { fontSize: 12, color: GREY_MUTED, marginTop: 2 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  downloadText: { fontSize: 14, fontWeight: '600', color: PRIMARY_BLUE },
  endLabel: {
    fontSize: 12,
    color: GREY_LIGHT,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
