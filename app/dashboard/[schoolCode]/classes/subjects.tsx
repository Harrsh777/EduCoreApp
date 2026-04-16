/**
 * Add/Modify Subjects — spec path /classes/subjects.
 * CRUD subjects for the school. Placeholder: link to classes for now.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSchoolCode } from '@/lib/school-context';

const UI = { bg: '#F8FAFC', card: '#FFFFFF', text: '#111827', muted: '#6B7280', primary: '#2563EB' };

export default function SubjectsScreen() {
  const router = useRouter();
  const { path } = useSchoolCode();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Add/Modify Subjects</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          Manage subjects (name, code) for your school. Subject management can be done from the Classes module or via API.
        </Text>
        <Pressable style={styles.btn} onPress={() => router.push(path('classes') as never)}>
          <Text style={styles.btnText}>Open Classes</Text>
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
  card: { margin: 16, backgroundColor: UI.card, padding: 20, borderRadius: 16 },
  cardText: { fontSize: 14, color: UI.muted, marginBottom: 16 },
  btn: { backgroundColor: UI.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignSelf: 'flex-start' },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
