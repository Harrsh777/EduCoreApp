/**
 * Student Siblings — spec path /students/siblings.
 * Link siblings (associate students as siblings). Select student → add sibling.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSchoolCode } from '@/lib/school-context';

const UI = { bg: '#F8FAFC', card: '#FFFFFF', text: '#111827', muted: '#6B7280', primary: '#0D9488' };

export default function StudentSiblingsScreen() {
  const router = useRouter();
  const { path } = useSchoolCode();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Student Siblings</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          Link students as siblings. Open a student from the directory to add or remove sibling links.
        </Text>
        <Pressable style={styles.btn} onPress={() => router.push(path('students') as never)}>
          <Text style={styles.btnText}>Open Student Directory</Text>
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
