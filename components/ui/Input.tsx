/**
 * Text input component using theme tokens.
 */

import { TextInput, View, Text, StyleSheet, type TextInputProps } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.text.tertiary}
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing[3] },
  label: { ...textStyles.label, color: colors.text.secondary, marginBottom: spacing[0.5] },
  input: {
    ...textStyles.body,
    color: colors.text.primary,
    backgroundColor: colors.surface.default,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    minHeight: 44,
  },
  inputError: { borderColor: colors.error.main },
  errorText: { ...textStyles.caption, color: colors.error.main, marginTop: spacing[0.5] },
});
