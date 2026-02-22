/**
 * Dashboard sidebar: all 24 modules; items with submodules expand on click.
 * Uses explicit font sizes and no complex typography to avoid text distortion on mobile.
 */

import { DASHBOARD_MENU_ITEMS, type DashboardMenuItem } from '@/constants/dashboardMenu';
import { useSchoolCode } from '@/lib/school-context';
import { radii, spacing } from '@/theme/spacing';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const SIDEBAR_WIDTH = 280;
const GREY = '#6B7280';

type Props = {
  onNavigate?: () => void;
};

export function DashboardSidebar({ onNavigate }: Props) {
  const router = useRouter();
  const { path } = useSchoolCode();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = useCallback((label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const goTo = useCallback(
    (itemPath: string) => {
      if (!itemPath || itemPath === '') {
        router.replace(path('') as never);
      } else {
        router.push(path(itemPath) as never);
      }
      onNavigate?.();
    },
    [path, router, onNavigate]
  );

  const handleMainPress = useCallback(
    (item: DashboardMenuItem) => {
      if (item.children && item.children.length > 0) {
        toggleExpand(item.label);
      } else {
        goTo(item.path);
      }
    },
    [toggleExpand, goTo]
  );

  return (
    <View style={[styles.sidebar, Platform.OS === 'web' && styles.sidebarWeb]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.menuTitle}>Menu</Text>
        {DASHBOARD_MENU_ITEMS.map((item) => {
          const isExpanded = expanded[item.label];
          const hasChildren = item.children && item.children.length > 0;
          return (
            <View key={item.label} style={styles.itemWrap}>
              <Pressable
                style={({ pressed }) => [
                  styles.mainRow,
                  pressed && styles.mainRowPressed,
                ]}
                onPress={() => handleMainPress(item)}
              >
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={GREY}
                  style={styles.mainIcon}
                />
                <Text style={styles.mainLabel} numberOfLines={2} ellipsizeMode="tail">
                  {item.label}
                </Text>
                {hasChildren && (
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={GREY}
                    style={styles.chevron}
                  />
                )}
              </Pressable>
              {hasChildren && isExpanded && (
                <View style={styles.childrenWrap}>
                  {item.children!.map((sub) => (
                    <Pressable
                      key={sub.path + sub.label}
                      style={({ pressed }) => [
                        styles.subRow,
                        pressed && styles.subRowPressed,
                      ]}
                      onPress={() => goTo(sub.path)}
                    >
                      <Text style={styles.subLabel} numberOfLines={2} ellipsizeMode="tail">
                        {sub.label}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={GREY} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  sidebarWeb: {
    minHeight: '100vh',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: spacing[5], paddingBottom: spacing[12] },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  itemWrap: { marginBottom: spacing[2] },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    minHeight: 48,
  },
  mainRowPressed: { backgroundColor: '#E5E7EB' },
  mainIcon: { marginRight: spacing[3] },
  mainLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    minWidth: 0,
  },
  chevron: { marginLeft: spacing[2] },
  childrenWrap: {
    paddingLeft: spacing[4] + 20 + spacing[3],
    paddingRight: spacing[4],
    paddingBottom: spacing[2],
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    minHeight: 44,
    borderRadius: radii.md,
  },
  subRowPressed: { backgroundColor: '#E5E7EB' },
  subLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    flex: 1,
    minWidth: 0,
  },
  bottomPad: { height: spacing[8] },
});
