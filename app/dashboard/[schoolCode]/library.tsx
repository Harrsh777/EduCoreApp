/**
 * Library: books, transactions, return. APIs: GET /api/library/books, transactions.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { libraryService } from '@/services/library.service';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function LibraryScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();

  const { data, isLoading } = useQuery({
    queryKey: ['library', 'books', schoolCode],
    queryFn: () => libraryService.getBooks(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const books = (data as { data?: unknown[] })?.data ?? (Array.isArray(data) ? data : []);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Library</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Books" />
        {isLoading && !Array.isArray(books)?.length ? (
          <ActivityIndicator size="small" color={INDIGO} style={styles.loader} />
        ) : Array.isArray(books) && books.length > 0 ? (
          (books as { id?: string; title?: string }[]).map((b, i) => (
            <View key={b.id ?? i} style={styles.card}>
              <Text style={styles.cardTitle}>{b.title ?? '—'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No books. Use web app for catalogue and issue/return.</Text>
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
  card: { backgroundColor: '#fff', padding: spacing[3], borderRadius: 8, marginBottom: spacing[2], borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { ...textStyles.body, color: '#111827' },
});
