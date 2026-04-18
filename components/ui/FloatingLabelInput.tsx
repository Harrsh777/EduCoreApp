/**
 * Large enterprise input with floating label.
 */

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';
import { fontSize, textStyles } from '@/theme/typography';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

const LABEL_TOP = spacing[2];
const LABEL_FOCUSED_TOP = -spacing[1];
const LABEL_FOCUSED_FONT = fontSize.sm;
const LABEL_NORMAL_FONT = fontSize.base;

export type InputThemeOverrides = {
  labelColor?: string;
  inputColor?: string;
  placeholderColor?: string;
  borderColor?: string;
  focusColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
};

type FloatingLabelInputProps = TextInputProps & {
  label: string;
  error?: string;
  themeOverrides?: InputThemeOverrides;
  /** Shown inside the field on the right (e.g. password visibility toggle) */
  rightAccessory?: ReactNode;
};

export function FloatingLabelInput({
  label,
  error,
  value,
  onFocus,
  onBlur,
  style,
  themeOverrides,
  rightAccessory,
  ...rest
}: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(value && String(value).trim());
  const floating = focused || hasValue;
  const o = themeOverrides;
  const labelColor = o?.labelColor ?? colors.text.tertiary;
  const inputColor = o?.inputColor ?? colors.text.primary;
  const placeholderColor = o?.placeholderColor ?? colors.text.tertiary;
  const borderColor = o?.borderColor ?? colors.border.default;
  const focusColor = o?.focusColor ?? colors.primary[600];
  const backgroundColor = o?.backgroundColor ?? colors.surface.default;
  const fontFamily = o?.fontFamily;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputWrap,
          { borderColor: error ? colors.error.main : borderColor, backgroundColor },
          error && styles.inputWrapError,
        ]}
      >
  <Text
  style={[
    styles.label,
    {
      color: floating ? focusColor : labelColor,
      opacity: 1, // 👈 ensure no fading
    },
    fontFamily && { fontFamily },
    floating && styles.labelFloating,
    error && styles.labelError,
  ]}
>
          {label}
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              { color: inputColor },
              fontFamily && { fontFamily },
              rightAccessory ? styles.inputWithAccessory : undefined,
              style,
            ]}
            value={value}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
          placeholder=" "
placeholderTextColor="transparent"
            {...rest}
          />
          {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
        </View>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing[5] },
  inputWrap: {
    borderWidth: 2,
    borderRadius: radii.lg,
    minHeight: 56,
    justifyContent: 'center',
    paddingTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  inputWrapError: { borderColor: colors.error.main },
  label: {
    position: 'absolute',
    left: spacing[4],
    ...textStyles.body,
  },
  labelFloating: {
    top: LABEL_FOCUSED_TOP,
    fontSize: LABEL_FOCUSED_FONT,
    fontWeight: '500',
  },
  labelError: { color: colors.error.main },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  input: {
    ...textStyles.body,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    paddingVertical: 0,
    minHeight: 24,
    flex: 1,
  },
  inputWithAccessory: {
    paddingRight: spacing[1],
  },
  accessory: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: spacing[2],
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error.main,
    marginTop: spacing[0.5],
    marginLeft: spacing[1],
  },
});
