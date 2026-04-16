/** Spec path /examinations/create — create exam (stepper: info, classes, subjects, schedule). */
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSchoolCode } from '@/lib/school-context';

const UI = { bg: '#F8FAFC', text: '#111827', muted: '#6B7280', primary: '#2563EB' };

export default function CreateExaminationScreen() {
  const router = useRouter();
  const { path } = useSchoolCode();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Create Examination</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.hint}>Stepper: (1) Basic info → (2) Classes → (3) Subjects & max marks → (4) Schedule. Use POST /api/examinations/v2/create.</Text>
        <Pressable style={styles.btn} onPress={() => router.push(path('examinations') as never)}>
          <Text style={styles.btnText}>View examinations</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  backBtn: { padding: 8, marginRight: 8 },
  backText: { fontSize: 16, color: UI.primary },
  title: { fontSize: 20, fontWeight: '700', color: UI.text },
  card: { margin: 16, backgroundColor: '#fff', padding: 20, borderRadius: 16 },
  hint: { fontSize: 14, color: UI.muted, marginBottom: 16 },
  btn: { backgroundColor: UI.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignSelf: 'flex-start' },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
