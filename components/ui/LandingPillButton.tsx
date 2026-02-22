/**
 * Full-width pill button for landing: purple gradient, soft glow on press, ripple.
 */

import { Pressable, Text, StyleSheet, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles } from '@/theme/typography';
import { spacing, radii } from '@/theme/spacing';
import { shadowStyle } from '@/theme/shadowWeb';

type LandingPillButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'outline' | 'secondary';
  colors?: [string, string];
};

const PURPLE_GRADIENT: [string, string] = ['#7C3AED', '#6D28D9'];

export function LandingPillButton({
  title,
  variant = 'primary',
  colors = PURPLE_GRADIENT,
  style,
  disabled,
  ...rest
}: LandingPillButtonProps) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  const content = isPrimary ? (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Text style={styles.text}>{title}</Text>
    </LinearGradient>
  ) : (
    <Text
      style={[
        styles.text,
        isOutline ? styles.textOutline : styles.textSecondary,
      ]}
    >
      {title}
    </Text>
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.wrapper,
        (isOutline || variant === 'secondary') && styles.wrapperOutline,
        pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      disabled={disabled}
      {...rest}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: radii.full,
    overflow: 'hidden',
    ...shadowStyle({
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    }),
  },
  wrapperOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.5)',
    ...shadowStyle({ shadowColor: 'transparent', shadowOpacity: 0, elevation: 0 }),
  },
  gradient: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    ...textStyles.button,
    color: '#FFFFFF',
    fontSize: 17,
  },
  textOutline: {
    color: '#7C3AED',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },
  textSecondary: {
    color: '#6B7280',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },
});
