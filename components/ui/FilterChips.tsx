/**
 * FilterChips: horizontal selectable chips for filters.
 */

import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type ChipOption = { id: string; label: string };

type FilterChipsProps = {
  options: ChipOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function FilterChips({ options, selectedId, onSelect }: FilterChipsProps) {
  const { colors: c, spacing, radii } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.wrap, { gap: spacing[2], paddingVertical: spacing[2] }]}
    >
      {options.map((opt) => {
        const selected = selectedId === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? c.primary[600] : c.surface.subdued,
                borderRadius: radii.full,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1.5],
                borderWidth: 1,
                borderColor: selected ? c.primary[600] : c.border.default,
              },
            ]}
          >
            <Text
              style={[styles.chipText, { color: selected ? c.text.inverse : c.text.primary }]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row' },
  chip: {},
  chipText: { fontSize: 14, fontWeight: '500' },
});
