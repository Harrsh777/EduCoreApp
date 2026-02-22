/**
 * Wraps dashboard content with sidebar. Web: sidebar always visible. Native: sidebar overlay when open; backdrop closes it.
 */

import { showSidebarOnWeb, useSidebar } from '@/lib/sidebar-context';
import { shadowStyle } from '@/theme/shadowWeb';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { DashboardSidebar } from './DashboardSidebar';

const SIDEBAR_WIDTH = 280;
const sidebarOverlayShadow = Platform.OS === 'web'
  ? shadowStyle({ shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 })
  : { shadowColor: '#000' as const, shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 };

type Props = {
  children: React.ReactNode;
};

export function DashboardWithSidebar({ children }: Props) {
  const { isOpen, close } = useSidebar();
  const showSidebar = showSidebarOnWeb || isOpen;

  return (
    <View style={styles.container}>
      {showSidebarOnWeb && (
        <View style={styles.sidebarWrap}>
          <DashboardSidebar onNavigate={close} />
        </View>
      )}
      <View style={styles.content}>{children}</View>
      {Platform.OS !== 'web' && isOpen && (
        <Pressable style={styles.backdrop} onPress={close} />
      )}
      {Platform.OS !== 'web' && showSidebar && (
        <View style={[styles.sidebarWrap, styles.sidebarOverlay]}>
          <DashboardSidebar onNavigate={close} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5,
    elevation: 5,
  },
  sidebarWrap: {
    zIndex: 10,
    elevation: 10,
  },
  sidebarOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFFFFF',
    ...sidebarOverlayShadow,
  },
});
