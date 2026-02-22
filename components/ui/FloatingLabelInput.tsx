/**
 * Large enterprise input with floating label.
 */

import { View, TextInput, Text, StyleSheet, type TextInputProps } from 'react-native';
import { useState } from 'react';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { textStyles, fontSize } from '@/theme/typography';

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
};

export function FloatingLabelInput({
  label,
  error,
  value,
  onFocus,
  onBlur,
  style,
  themeOverrides,
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
            { color: labelColor, pointerEvents: 'none' },
            fontFamily && { fontFamily },
            floating && styles.labelFloating,
            floating && { color: focusColor },
            error && styles.labelError,
          ]}
        >
          {label}
        </Text>
        <TextInput
          style={[styles.input, { color: inputColor }, fontFamily && { fontFamily }, style]}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={placeholderColor}
          placeholder={floating ? '' : undefined}
          {...rest}
        />
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
  input: {
    ...textStyles.body,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    paddingVertical: 0,
    minHeight: 24,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error.main,
    marginTop: spacing[0.5],
    marginLeft: spacing[1],
  },
});
