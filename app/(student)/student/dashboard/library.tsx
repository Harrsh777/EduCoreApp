import { useStudent } from '@/lib/student-context';
import { libraryService } from '@/services/library.service';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const PRIMARY = '#2563EB';
const BG = '#F3F4F6';

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function StudentLibraryScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';

  const [tab, setTab] = useState<'all' | 'borrowed'>('all');
  const [availableOnly, setAvailableOnly] = useState(false);

  const { data: myBooksData, isRefetching, refetch } = useQuery({
    queryKey: ['library', 'borrower', schoolCode, studentId],
    queryFn: () =>
      libraryService
        .getBorrowerTransactions(schoolCode, {
          borrower_type: 'student',
          borrower_id: studentId,
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && studentId),
  });

  const { data: booksData, isLoading } = useQuery({
    queryKey: ['library', 'books', schoolCode],
    queryFn: () =>
      libraryService.getBooks(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const myBooks =
    Array.isArray(myBooksData)
      ? myBooksData
      : (myBooksData as any)?.data ?? [];

  const catalogue =
    Array.isArray(booksData)
      ? booksData
      : (booksData as any)?.data ?? [];

  const availableCount = catalogue.length;
  const borrowedCount = myBooks.length;
  const overdueCount = myBooks.filter(
    (b: any) => b.status?.toLowerCase() === 'overdue'
  ).length;

  const visibleBooks = useMemo(() => {
    if (tab === 'borrowed') return myBooks;
    if (availableOnly)
      return catalogue.filter((b: any) => b.available > 0);
    return catalogue;
  }, [tab, availableOnly, catalogue, myBooks]);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={PRIMARY}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Library</Text>
          <Pressable style={styles.searchBtn}>
            <Ionicons name="search" size={20} color="#0F172A" />
          </Pressable>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <Stat label="Available" value={availableCount} active />
          <Stat label="Borrowed" value={borrowedCount} />
          <Stat label="Overdue" value={overdueCount} />
        </View>

        {/* SEGMENTED CONTROL */}
        <View style={styles.segment}>
          <Pressable
            style={[
              styles.segmentBtn,
              tab === 'all' && styles.segmentActive,
            ]}
            onPress={() => setTab('all')}
          >
            <Text
              style={[
                styles.segmentText,
                tab === 'all' && styles.segmentTextActive,
              ]}
            >
              All Books
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentBtn,
              tab === 'borrowed' && styles.segmentActive,
            ]}
            onPress={() => setTab('borrowed')}
          >
            <Text
              style={[
                styles.segmentText,
                tab === 'borrowed' && styles.segmentTextActive,
              ]}
            >
              My Borrowed
            </Text>
          </Pressable>
        </View>

        {/* FILTER CHIPS */}
        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterChip,
              availableOnly && styles.filterActive,
            ]}
            onPress={() => setAvailableOnly(!availableOnly)}
          >
            <Text
              style={[
                styles.filterText,
                availableOnly && styles.filterTextActive,
              ]}
            >
              Available Only
            </Text>
          </Pressable>

          <View style={styles.filterChip}>
            <Text style={styles.filterText}>Fiction</Text>
          </View>

          <View style={styles.iconChip}>
            <Ionicons name="options-outline" size={18} color="#64748B" />
          </View>
        </View>

        {/* BOOK CARDS */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={PRIMARY}
            style={{ marginTop: 40 }}
          />
        ) : (
          visibleBooks.map((book: any, i: number) => (
            <View key={book.id ?? i} style={styles.card}>
              <Image
                source={{
                  uri:
                    book.cover_url ??
                    'https://via.placeholder.com/120x160',
                }}
                style={styles.cover}
              />

              <View style={{ flex: 1 }}>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>
                    {tab === 'borrowed'
                      ? 'BORROWED'
                      : 'AVAILABLE'}
                  </Text>
                </View>

                <Text style={styles.bookTitle}>
                  {book.title ?? book.book_title}
                </Text>

                <Text style={styles.author}>
                  by {book.author ?? 'Unknown'}
                </Text>

                {tab === 'borrowed' ? (
                  <Text style={styles.meta}>
                    Due {formatDate(book.due_date)}
                  </Text>
                ) : (
                  <Text style={styles.meta}>
                    {book.available ?? 0} copies in stock
                  </Text>
                )}

                <Pressable style={styles.detailsBtn}>
                  <Text style={styles.detailsText}>
                    View Details
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Stat({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <View
      style={[
        styles.statBox,
        active && styles.statActive,
      ]}
    >
      <Text
        style={[
          styles.statLabel,
          active && { color: PRIMARY },
        ]}
      >
        {label.toUpperCase()}
      </Text>
      <Text
        style={[
          styles.statValue,
          active && { color: PRIMARY },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  container: { padding: 20, paddingBottom: 100 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0F172A',
  },

  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    padding: 16,
    borderRadius: 20,
  },

  statActive: {
    backgroundColor: '#E0ECFF',
  },

  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 30,
    marginTop: 24,
    padding: 4,
  },

  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },

  segmentActive: {
    backgroundColor: '#fff',
  },

  segmentText: {
    color: '#64748B',
    fontWeight: '600',
  },

  segmentTextActive: {
    color: PRIMARY,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },

  filterActive: {
    backgroundColor: '#E0ECFF',
  },

  filterText: {
    color: '#64748B',
    fontWeight: '500',
  },

  filterTextActive: {
    color: PRIMARY,
  },

  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 24,
    marginTop: 24,
    elevation: 3,
  },

  cover: {
    width: 100,
    height: 140,
    borderRadius: 20,
    marginRight: 16,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },

  statusText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },

  bookTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  author: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },

  meta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },

  detailsBtn: {
    alignSelf: 'flex-start',
  },

  detailsText: {
    color: PRIMARY,
    fontWeight: '600',
  },
});