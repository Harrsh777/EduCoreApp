/**
 * ScreenWrapper: consistent screen layout with optional refresh and loading.
 */

import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';

const { colors, spacing: s } = teacherDashboardTheme;

type ScreenWrapperProps = {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
};

export function ScreenWrapper({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  loading = false,
  contentContainerStyle,
  style,
}: ScreenWrapperProps) {
  if (loading) {
    return (
      <View style={[styles.root, style]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (scroll) {
    return (
      <ScrollView
        style={[styles.root, style]}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.root, styles.content, style, contentContainerStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  loader: { flex: 1, marginTop: 80 },
});
