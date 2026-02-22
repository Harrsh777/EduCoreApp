/**
 * Primary button component using theme tokens.
 */

import { Pressable, Text, StyleSheet, ActivityIndicator, type PressableProps, type TextStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  titleStyle?: TextStyle;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  disabled,
  loading = false,
  style,
  titleStyle,
  ...rest
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const paddingVertical = size === 'sm' ? spacing[1.5] : size === 'lg' ? spacing[3] : spacing[2];
  const paddingHorizontal = size === 'sm' ? spacing[3] : size === 'lg' ? spacing[6] : spacing[4];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isOutline ? 'transparent' : isPrimary ? colors.primary[600] : colors.neutral[200],
          borderWidth: isOutline ? 2 : 0,
          borderColor: colors.primary[600],
          paddingVertical,
          paddingHorizontal,
          opacity: isDisabled ? 0.6 : pressed ? 0.9 : 1,
        },
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.text.inverse : isOutline ? colors.primary[600] : colors.text.primary} size="small" />
      ) : (
        <Text
          style={[
            textStyles.button,
            {
              color: isOutline ? colors.primary[600] : isPrimary ? colors.text.inverse : colors.text.primary,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
