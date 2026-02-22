/**
 * BottomNavBar — 4 tabs: Home | Calendar | Messages | Profile.
 * Glass blur background, soft top border, active = filled icon + blue dot.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { studentDashboardTheme } from '@/theme/studentDashboard';

const { colors } = studentDashboardTheme;

export type StudentTab = 'home' | 'calendar' | 'messages' | 'profile';

type TabItem = {
  key: StudentTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
};

const TABS: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconFilled: 'home' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar-outline', iconFilled: 'calendar' },
  { key: 'messages', label: 'Messages', icon: 'chatbubble-outline', iconFilled: 'chatbubbles' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', iconFilled: 'person' },
];

function TabBtn({
  tab,
  isActive,
  onPress,
}: {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={isActive ? tab.iconFilled : tab.icon}
          size={24}
          color={isActive ? colors.primary : colors.textMuted}
        />
        {isActive && <View style={styles.dot} />}
      </View>
      <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
    </Pressable>
  );
}

export function BottomNavBar({
  activeTab,
  onTabChange,
}: {
  activeTab: StudentTab;
  onTabChange: (tab: StudentTab) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { paddingBottom: insets.bottom }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {TABS.map((tab) => (
          <TabBtn
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={() => onTabChange(tab.key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 56,
  },
  tabPressed: { opacity: 0.8 },
  iconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  dot: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
