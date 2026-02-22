/**
 * SearchBar: large search input with placeholder.
 */

import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { textStyles } from '@/theme/typography';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search...', editable = true }: SearchBarProps) {
  const { colors: c, spacing, radii, shadows } = useTheme();

  return (
    <View style={[styles.wrap, { marginBottom: spacing[3] }]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: c.surface.default,
            color: c.text.primary,
            borderRadius: radii.lg,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[2.5],
            borderWidth: 1,
            borderColor: c.border.default,
            ...shadows.sm,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.text.tertiary}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  input: { ...textStyles.body, minHeight: 44 },
});
