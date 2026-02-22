/**
 * Sidebar open state for dashboard. Used so screens (e.g. Home) can toggle the sidebar on mobile.
 */

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

type SidebarContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) return {
    isOpen: false,
    open: () => {},
    close: () => {},
    toggle: () => {},
  };
  return ctx;
}

type SidebarProviderProps = { children: ReactNode };

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const value: SidebarContextValue = { isOpen, open, close, toggle };
  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export const showSidebarOnWeb = Platform.OS === 'web';
