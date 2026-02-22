import { AppCard, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { StyleSheet, Text, View } from 'react-native';

export default function StudentMyClassScreen() {
  const { spacing, colors: c } = useTheme();
  const { profile } = useSession();
  const p = profile as { class?: string; section?: string } | undefined;

  return (
    <View style={styles.container}>
      <SectionHeader title="My class" />
      <AppCard style={{ margin: spacing[4] }}>
        <Text style={[styles.label, { color: c.text.secondary }]}>Class</Text>
        <Text style={[styles.value, { color: c.text.primary }]}>{p?.class ?? '—'}-{p?.section ?? '—'}</Text>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 14 },
  value: { fontSize: 20, fontWeight: '600', marginTop: 4 },
});
