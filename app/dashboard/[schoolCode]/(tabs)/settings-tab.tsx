/**
 * Settings tab: entry to stack Settings (roles, etc.).
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSchoolCode } from '@/lib/school-context';

const UI = { bg: '#F8FAFC', card: '#FFFFFF', text: '#111827', muted: '#6B7280', primary: '#4F46E5' };

export default function SettingsTabScreen() {
  const router = useRouter();
  const { path } = useSchoolCode();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Settings</Text>
      <Pressable
        style={styles.card}
        onPress={() => router.push(path('settings/roles') as never)}
      >
        <Ionicons name="shield-checkmark" size={24} color={UI.primary} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>Role Management</Text>
          <Text style={styles.cardSub}>Manage roles and permissions</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={UI.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg, padding: 24, paddingTop: 56 },
  title: { fontSize: 20, fontWeight: '700', color: UI.text, marginBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
  },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: UI.text },
  cardSub: { fontSize: 13, color: UI.muted, marginTop: 2 },
});
