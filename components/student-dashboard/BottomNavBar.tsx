/**
 * Bottom nav — each tab has a distinct hue; active = saturated, idle = soft.
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
  active: string;
  idle: string;
  bubble: string;
};

const TABS: TabItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home-outline',
    iconFilled: 'home',
    active: '#6D28D9',
    idle: '#C4B5FD',
    bubble: 'rgba(109, 40, 217, 0.14)',
  },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: 'calendar-outline',
    iconFilled: 'calendar',
    active: '#DB2777',
    idle: '#F9A8D4',
    bubble: 'rgba(219, 39, 119, 0.14)',
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: 'chatbubble-outline',
    iconFilled: 'chatbubbles',
    active: '#0891B2',
    idle: '#67E8F9',
    bubble: 'rgba(8, 145, 178, 0.14)',
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    iconFilled: 'person',
    active: '#D97706',
    idle: '#FCD34D',
    bubble: 'rgba(217, 119, 6, 0.14)',
  },
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
  const iconColor = isActive ? tab.active : tab.idle;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
    >
      <View style={[styles.iconBubble, isActive && { backgroundColor: tab.bubble }]}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isActive ? tab.iconFilled : tab.icon}
            size={24}
            color={iconColor}
          />
          {isActive ? <View style={[styles.dot, { backgroundColor: tab.active }]} /> : null}
        </View>
      </View>
      <Text style={[styles.label, isActive && { color: tab.active, fontWeight: '700' }]}>{tab.label}</Text>
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

const barShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      }
    : {};

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
    paddingTop: 10,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.25)',
    backgroundColor: 'rgba(255,255,255,0.94)',
    ...barShadow,
    ...(Platform.OS === 'android' ? { elevation: 10 } : {}),
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  tabPressed: { transform: [{ scale: 0.97 }] },
  iconBubble: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 2,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
