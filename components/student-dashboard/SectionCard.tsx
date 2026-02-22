/**
 * Section card: title + grid of ModuleButtons. Optional 3-column grid for Academics.
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

const { colors, cardRadius, cardPadding, webSolid, spacing: s } = studentDashboardTheme;

type SectionCardProps = ViewProps & {
  title: string;
  children: React.ReactNode;
  /** 3 = three-column grid for Academics */
  gridColumns?: 2 | 3;
};

export function SectionCard({ title, children, gridColumns, style, ...rest }: SectionCardProps) {
  const childArray = React.Children.toArray(children);
  const gridStyle = gridColumns === 3 ? styles.grid3 : styles.grid;
  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <View style={gridStyle}>
          {gridColumns === 3
            ? childArray.map((child, i) => (
                <View key={i} style={styles.grid3Item}>
                  {child}
                </View>
              ))
            : children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: s.lg, marginBottom: s['2xl'] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: cardRadius,
    padding: cardPadding,
    borderWidth: 1,
    borderColor: webSolid.borderCard,
  },
  title: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: s.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.lg,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.md,
  },
  grid3Item: {
    width: '31%',
    minWidth: 90,
  },
});
