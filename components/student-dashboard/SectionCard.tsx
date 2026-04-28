/**
 * Section card: title + grid of ModuleButtons. Optional 3-column grid for Academics.
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { studentDashboardTheme, studentDashboardCardStyle } from '@/theme/studentDashboard';

const { colors, cardPadding, spacing: s } = studentDashboardTheme;

type SectionCardProps = ViewProps & {
  title: string;
  children: React.ReactNode;
  gridColumns?: 2 | 3;
};

export function SectionCard({ title, children, gridColumns, style, ...rest }: SectionCardProps) {
  const childArray = React.Children.toArray(children);
  const _gridColumns = gridColumns; // retained for backward-compatible prop API
  const splitIndex = Math.ceil(childArray.length / 2);
  const leftColumn = childArray.slice(0, splitIndex);
  const rightColumn = childArray.slice(splitIndex);

  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.columns}>
          <View style={styles.column}>
            {leftColumn.map((child, i) => (
              <View key={`left-${i}`} style={styles.item}>
                {child}
              </View>
            ))}
          </View>
          <View style={styles.column}>
            {rightColumn.map((child, i) => (
              <View key={`right-${i}`} style={styles.item}>
              {child}
              </View>
            ))}
          </View>
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
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    marginBottom: s.lg,
  },
  columns: {
    flexDirection: 'row',
    gap: s.md,
  },
  column: {
    flex: 1,
    gap: s.md,
  },
  item: {
    width: '100%',
  },
});
