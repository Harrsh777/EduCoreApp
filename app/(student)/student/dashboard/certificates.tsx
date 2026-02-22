import { useStudent } from '@/lib/student-context';
import { certificateService } from '@/services/certificate.service';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const PRIMARY = '#3B82F6';
const BG = '#F5F7FA';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER = '#E5E7EB';

export default function StudentCertificatesScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';

  const [filter, setFilter] = useState<'all' | 'uploaded' | 'generated'>('all');

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['certificates', schoolCode, studentId],
    queryFn: () => certificateService.getCertificates(schoolCode, studentId).then((r) => r.data),
    enabled: Boolean(schoolCode && studentId),
  });

  const list = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const filtered = useMemo(() => {
    if (filter === 'all') return list;
    return list.filter((c: any) => c.type === filter);
  }, [list, filter]);

  const uploadedCount = list.filter((c: any) => c.type === 'uploaded').length;
  const generatedCount = list.filter((c: any) => c.type === 'generated').length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Certificates</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{list.length}</Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </View>

      {/* Summary Pills */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryPill, { borderColor: PRIMARY }]}>
          <Text style={styles.summaryLabel}>Uploaded</Text>
          <Text style={[styles.summaryValue, { color: PRIMARY }]}>
            {uploadedCount}
          </Text>
        </View>

        <View style={styles.summaryPill}>
          <Text style={styles.summaryLabel}>Generated</Text>
          <Text style={styles.summaryValue}>{generatedCount}</Text>
        </View>
      </View>

      {/* Segmented Control */}
      <View style={styles.segment}>
        {['all', 'uploaded', 'generated'].map((key) => (
          <Pressable
            key={key}
            style={[
              styles.segmentItem,
              filter === key && styles.segmentActive,
            ]}
            onPress={() => setFilter(key as any)}
          >
            <Text
              style={[
                styles.segmentText,
                filter === key && styles.segmentTextActive,
              ]}
            >
              {key === 'all'
                ? 'All'
                : key === 'uploaded'
                ? 'Uploaded'
                : 'Generated'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={PRIMARY} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircle}>
              <Text style={styles.emptyIcon}>🏅</Text>
            </View>

            <Text style={styles.emptyTitle}>
              No certificates found
            </Text>
            <Text style={styles.emptySubtitle}>
              Your certificates will appear here once they are issued or uploaded.
            </Text>

            <Pressable style={styles.contactBtn}>
              <Text style={styles.contactText}>Contact Registrar</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map((c: any) => (
            <View key={c.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {c.name ?? 'Certificate'}
              </Text>
              <Pressable
                style={styles.downloadBtn}
                onPress={() => {
                  certificateService
                    .getCertificateDownloadUrl(schoolCode, c.id)
                    .then((r) => {
                      const url = r.data?.url;
                      if (url) Linking.openURL(url);
                      else Alert.alert('Download not available');
                    });
                }}
              >
                <Text style={styles.downloadText}>Download</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },

  back: {
    fontSize: 28,
    color: TEXT_PRIMARY,
  },

  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  badge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },

  badgeText: {
    color: PRIMARY,
    fontWeight: '600',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  summaryPill: {
    flex: 1,
    backgroundColor: CARD,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryLabel: {
    color: TEXT_SECONDARY,
  },

  summaryValue: {
    fontWeight: '700',
    fontSize: 18,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
  },

  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },

  segmentActive: {
    backgroundColor: CARD,
  },

  segmentText: {
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },

  segmentTextActive: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },

  emptyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E5EAF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyIcon: {
    fontSize: 48,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },

  emptySubtitle: {
    textAlign: 'center',
    color: TEXT_SECONDARY,
    paddingHorizontal: 40,
    marginBottom: 24,
  },

  contactBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: CARD,
  },

  contactText: {
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },

  card: {
    backgroundColor: CARD,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },

  cardTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: TEXT_PRIMARY,
    marginBottom: 10,
  },

  downloadBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  downloadText: {
    color: '#fff',
    fontWeight: '600',
  },
});