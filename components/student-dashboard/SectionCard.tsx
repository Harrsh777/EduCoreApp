/**
 * Section card: title + grid of ModuleButtons. Optional 3-column grid for Academics.
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { studentDashboardTheme, studentDashboardCardStyle } from '@/theme/studentDashboard';
import { textStyles } from '@/theme/typography';

const { colors, cardPadding, spacing: s } = studentDashboardTheme;

type SectionCardProps = ViewProps & {
  title: string;
  children: React.ReactNode;
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
  wrap: { marginHorizontal: s.xl, marginBottom: s['3xl'] },
  card: {
    ...studentDashboardCardStyle,
    backgroundColor: colors.surface,
    padding: cardPadding,
  },
  title: {
    ...textStyles.h4,
    fontWeight: '700',
    color: colors.primaryBright,
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
