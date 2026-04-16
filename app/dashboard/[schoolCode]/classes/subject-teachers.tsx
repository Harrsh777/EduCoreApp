/**
 * Subject Teachers — spec path /classes/subject-teachers.
 * Assign subject and teacher per class/section. Tap a class to manage from class detail.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';

const UI = { bg: '#F8FAFC', card: '#FFFFFF', text: '#111827', muted: '#6B7280', primary: '#2563EB' };

export default function SubjectTeachersScreen() {
  const router = useRouter();
  const { schoolCode, path } = useSchoolCode();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['classes', schoolCode],
    queryFn: () => schoolService.getClasses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Subject Teachers</Text>
      </View>
      <Text style={styles.subtitle}>Select a class to assign subjects and teachers.</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={UI.primary} style={styles.loader} />
      ) : isError ? (
        <Text style={styles.error}>Failed to load classes. Tap back to retry.</Text>
      ) : (
        <View style={styles.list}>
          {list.map((item: { id?: string; name?: string; section?: string; class_name?: string }) => (
            <Pressable
              key={item.id ?? ''}
              style={styles.row}
              onPress={() => router.push(path(`classes/${item.id}`) as never)}
            >
              <Text style={styles.rowName}>{item.name ?? item.class_name ?? item.id ?? '—'}</Text>
              {item.section ? <Text style={styles.rowMeta}>{item.section}</Text> : null}
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  backBtn: { padding: 8, marginRight: 8 },
  backText: { fontSize: 16, color: UI.primary },
  title: { fontSize: 20, fontWeight: '700', color: UI.text },
  subtitle: { fontSize: 14, color: UI.muted, paddingHorizontal: 16, marginBottom: 16 },
  loader: { marginTop: 24 },
  error: { fontSize: 14, color: '#DC2626', padding: 16 },
  list: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowName: { flex: 1, fontSize: 16, fontWeight: '600', color: UI.text },
  rowMeta: { fontSize: 14, color: UI.muted, marginRight: 8 },
  chevron: { fontSize: 18, color: UI.muted },
});
