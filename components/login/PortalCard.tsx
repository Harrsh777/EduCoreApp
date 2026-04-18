import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type PortalCardProps = {
  label: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  href: Href;
  width: number;
  height: number;
  borderColor: string;
  surfaceColor: string;
  labelColor: string;
  titleColor: string;
  iconCircleAlpha: string;
};

export function PortalCard({
  label,
  title,
  icon,
  iconTint,
  href,
  width,
  height,
  borderColor,
  surfaceColor,
  labelColor,
  titleColor,
  iconCircleAlpha,
}: PortalCardProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}`}
        style={({ pressed }) => [
          styles.card,
          {
            width,
            height,
            borderColor,
            backgroundColor: surfaceColor,
          },
          pressed && styles.cardPressed,
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${iconTint}${iconCircleAlpha}` }]}>
          <Ionicons name={icon} size={30} color={iconTint} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 14,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.94,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  textBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
    textAlign: 'center',
  },
});
