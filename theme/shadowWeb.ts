/**
 * Web-safe shadow: use boxShadow on web (shadow* deprecated), shadow* + elevation on native.
 */

import { Platform } from 'react-native';

function hexToRgba(hex: string, alpha: number): string {
  const match = hex.replace('#', '').match(/.{2}/g);
  if (!match) return `rgba(0,0,0,${alpha})`;
  const [r, g, b] = match.map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

export type ShadowParams = {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
};

export function shadowStyle(p: ShadowParams): Record<string, unknown> {
  if (Platform.OS === 'web') {
    const x = p.shadowOffset?.width ?? 0;
    const y = p.shadowOffset?.height ?? 0;
    const r = p.shadowRadius ?? 0;
    const color = p.shadowColor ?? '#000';
    const opacity = p.shadowOpacity ?? 0;
    const rgba = hexToRgba(color, opacity);
    return { boxShadow: `${x}px ${y}px ${r}px ${rgba}` };
  }
  return {
    shadowColor: p.shadowColor ?? 'transparent',
    shadowOffset: p.shadowOffset ?? { width: 0, height: 0 },
    shadowOpacity: p.shadowOpacity ?? 0,
    shadowRadius: p.shadowRadius ?? 0,
    elevation: p.elevation ?? 0,
  };
}
