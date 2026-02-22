import { AppCard, DataList, SearchBar, SectionHeader } from '@/components/ui';
import { useSchool } from '@/hooks/useSchool';
import { useTheme } from '@/hooks/useTheme';
import { libraryService } from '@/services/library.service';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Book = { id: string; title?: string; author?: string; isbn?: string; section_id?: string; [key: string]: unknown };

export default function SchoolLibraryScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'library-books', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await libraryService.getBooks(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const list = Array.isArray(data) ? data : [];
  const filtered = search.trim()
    ? list.filter(
        (b: Book) =>
          (b.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (b.author ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : list;

  return (
    <View style={styles.container}>
      <SectionHeader title="Library" />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search books..." />
      <DataList<Book>
        data={filtered}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No books"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{item.title ?? '—'}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>{item.author ?? ''} · {item.isbn ?? ''}</Text>
            <Text style={[styles.hint, { color: c.text.tertiary }]}>Issue/return from book detail</Text>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
  hint: { fontSize: 12, marginTop: 4 },
});
