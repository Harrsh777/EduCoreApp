/**
 * StudentTabBar — bridges React Navigation tab state → BottomNavBar.
 * 4 tabs: Home, Calendar, Messages, Profile.
 */

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomNavBar, type StudentTab } from './BottomNavBar';

const ROUTE_TO_TAB: Record<string, StudentTab> = {
  index: 'home',
  calendar: 'calendar',
  messages: 'messages',
  profile: 'profile',
};

const TAB_TO_ROUTE: Record<StudentTab, string> = {
  home: 'index',
  calendar: 'calendar',
  messages: 'messages',
  profile: 'profile',
};

export function StudentTabBar({ state, navigation }: BottomTabBarProps) {
  const activeRoute = state.routes[state.index]?.name ?? 'index';
  const activeTab = ROUTE_TO_TAB[activeRoute] ?? 'home';

  const onTabChange = (tab: StudentTab) => {
    const route = TAB_TO_ROUTE[tab];
    const exists = state.routes.some((r) => r.name === route);
    if (route && exists) {
      navigation.navigate(route as never);
    }
  };

  return <BottomNavBar activeTab={activeTab} onTabChange={onTabChange} />;
}
