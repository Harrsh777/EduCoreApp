/**
 * Library: search bar, book list with title, author, ISBN, availability badge.
 * GET /api/library/books.
 */

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { libraryService } from '@/services/library.service';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

type Book = { id?: string; title?: string; author?: string; isbn?: string; available?: boolean; status?: string; copies_available?: number };

export default function TeacherLibraryScreen() {
  const { schoolCode } = useTeacher();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['library', 'books', schoolCode],
    queryFn: () => libraryService.getBooks(schoolCode).then((r) => (r as { data?: Book[] })?.data ?? []),
    enabled: Boolean(schoolCode),
  });

  const books = (Array.isArray(data) ? data : []) as Book[];
  const filtered = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.trim().toLowerCase();
    return books.filter(
      (b) =>
        (b.title ?? '').toLowerCase().includes(q) ||
        (b.author ?? '').toLowerCase().includes(q) ||
        (b.isbn ?? '').toLowerCase().includes(q)
    );
  }, [books, search]);

  const isAvailable = (b: Book) => {
    if (b.available !== undefined) return b.available;
    if (b.copies_available != null) return b.copies_available > 0;
    return (b.status ?? '').toLowerCase() === 'available';
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Library" />
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, author, ISBN..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <ScreenWrapper scroll={false} loading={isLoading && !books.length}>
        {isError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id ?? String(Math.random())}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title ?? '—'}</Text>
                  <View style={[styles.badge, isAvailable(item) ? styles.badgeAvailable : styles.badgeUnavailable]}>
                    <Text style={[styles.badgeText, isAvailable(item) ? styles.badgeTextAvail : styles.badgeTextUnavail]}>
                      {isAvailable(item) ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>Author: {item.author ?? '—'}</Text>
                {item.isbn ? <Text style={styles.cardMeta}>ISBN: {item.isbn}</Text> : null}
              </Card>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No books found.</Text>}
          />
        )}
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: s.lg, paddingVertical: s.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: s.md, paddingVertical: s.sm, fontSize: 14, color: colors.textPrimary },
  listContent: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { marginBottom: s.lg },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s.sm },
  cardTitle: { flex: 1, ...textStyles.body, fontWeight: '600', color: colors.textPrimary },
  cardMeta: { ...textStyles.caption, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: s.sm, paddingVertical: 4, borderRadius: 9999 },
  badgeAvailable: { backgroundColor: colors.primaryLight },
  badgeUnavailable: { backgroundColor: colors.dangerLight },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextAvail: { color: colors.primaryDark },
  badgeTextUnavail: { color: colors.danger },
  centered: { flex: 1, padding: s.lg },
  errorText: { ...textStyles.body, color: colors.danger },
  empty: { ...textStyles.body, color: colors.textMuted, textAlign: 'center', marginTop: s.xl },
});
