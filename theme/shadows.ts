/**
 * Soft shadows for cards and elevated surfaces.
 * Web: boxShadow (shadow* deprecated). Native: iOS shadow* + Android elevation.
 */

import { Platform } from 'react-native';
import { shadowStyle } from './shadowWeb';

export const shadows = {
  none: shadowStyle({
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  }),
  sm: Platform.OS === 'web'
    ? shadowStyle({ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 })
    : Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 2,
        },
        android: { elevation: 2 },
      }),
  md: Platform.OS === 'web'
    ? shadowStyle({ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 4 })
    : Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        android: { elevation: 4 },
      }),
  lg: Platform.OS === 'web'
    ? shadowStyle({ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 })
    : Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: { elevation: 8 },
      }),
} as const;
