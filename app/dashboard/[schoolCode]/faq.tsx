/**
 * FAQ placeholder: link to web or expandable list later.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function FAQScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>FAQ</Text>
      </View>
      <View style={styles.content}>
        <SectionHeader title="Frequently asked questions" />
        <Text style={styles.body}>
          Common questions and answers will appear here. You can also check the web app for the full FAQ.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  content: { padding: spacing[6] },
  body: { ...textStyles.body, color: '#6B7280', marginTop: spacing[2] },
});
