/**
 * Avatar: initial(s) or image in a circle.
 */

import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type AvatarProps = {
  name?: string;
  source?: { uri: string } | number;
  size?: 'sm' | 'md' | 'lg';
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ name, source, size = 'md' }: AvatarProps) {
  const { colors: c, radii } = useTheme();

  const dim = size === 'sm' ? 32 : size === 'lg' ? 56 : 44;
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 14;

  const containerStyle = [
    styles.wrap,
    {
      width: dim,
      height: dim,
      borderRadius: radii.full,
      backgroundColor: c.primary[100],
    },
  ];

  if (source) {
    return (
      <Image
        source={typeof source === 'number' ? source : source}
        style={[containerStyle, styles.img]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={[styles.text, { color: c.primary[700], fontSize }]} numberOfLines={1}>
        {name ? getInitials(name) : '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  img: {},
  text: { fontWeight: '600' },
});
