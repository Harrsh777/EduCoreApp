/**
 * AppHeader: back button, title, optional right action. Clean green + white.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';

const { colors, spacing: s } = teacherDashboardTheme;

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function AppHeader({ title, subtitle, showBack = true, onBack, right }: AppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View style={styles.wrap}>
      {showBack && (
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
      )}
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.lg,
    paddingVertical: s.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  backBtn: { padding: s.sm, marginRight: s.sm },
  center: { flex: 1, minWidth: 0 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  right: {},
  placeholder: { width: 40 },
});
