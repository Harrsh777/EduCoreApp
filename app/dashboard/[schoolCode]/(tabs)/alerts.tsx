/**
 * Alerts tab: placeholder for notifications / alerts.
 */

import { View, Text, StyleSheet } from 'react-native';

const UI = { bg: '#F8FAFC', text: '#111827', muted: '#6B7280' };

export default function AlertsTabScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Alerts</Text>
      <Text style={styles.sub}>Notifications and alerts will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg, padding: 24, paddingTop: 56 },
  title: { fontSize: 20, fontWeight: '700', color: UI.text },
  sub: { fontSize: 14, color: UI.muted, marginTop: 8 },
});
