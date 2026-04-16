/**
 * Level 2 — Domain Hub
 * Renders sections and modules from domains.config. Full-width cards, section headers.
 * Collapsible section if more than 5 modules.
 */

import { getDomainById, type DomainConfig, type DomainSection } from '@/config/domains.config';
import { useSchoolCode } from '@/lib/school-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const UI = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  radius: 20,
  spacing: 8,
  text: '#111827',
  textMuted: '#6B7280',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
};

const COLLAPSE_THRESHOLD = 5;

export default function DomainHubScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ domainId?: string; schoolCode?: string }>();
  const domainId = params.domainId ?? '';
  const { path } = useSchoolCode();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const domain = useMemo(() => getDomainById(domainId), [domainId]);
  const sections = domain?.sections ?? [];

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const goToModule = (route: string) => {
    if (!route) return;
    router.push(path(route) as never);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(path('') as never);
  };

  if (!domain) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={UI.text} />
          </Pressable>
          <Text style={styles.title}>Domain</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Domain not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { borderLeftColor: domain.color }]}>
        <Pressable onPress={goBack} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={domain.color} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <View style={[styles.domainIconSmall, { backgroundColor: `${domain.color}20` }]}>
            <Ionicons
              name={(domain.icon as keyof typeof Ionicons.glyphMap) || 'folder'}
              size={22}
              color={domain.color}
            />
          </View>
          <Text style={styles.title}>{domain.title}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => {
          const sectionKey = section.id ?? section.title;
          const moduleCount = section.modules?.length ?? 0;
          const isCollapsible = moduleCount > COLLAPSE_THRESHOLD;
          const isCollapsed = collapsedSections[sectionKey];
          const showModules = !isCollapsible || !isCollapsed;

          return (
            <SectionBlock
              key={sectionKey}
              section={section}
              domainColor={domain.color}
              isCollapsible={isCollapsible}
              isCollapsed={isCollapsed}
              onToggle={() => toggleSection(sectionKey)}
              onModulePress={goToModule}
              showModules={showModules}
            />
          );
        })}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

type SectionBlockProps = {
  section: DomainSection;
  domainColor: string;
  isCollapsible: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onModulePress: (route: string) => void;
  showModules: boolean;
};

function SectionBlock({
  section,
  domainColor,
  isCollapsible,
  isCollapsed,
  onToggle,
  onModulePress,
  showModules,
}: SectionBlockProps) {
  const sectionKey = section.id ?? section.title;
  const modules = section.modules ?? [];

  return (
    <View style={styles.sectionWrap}>
      <Pressable
        style={styles.sectionHeader}
        onPress={isCollapsible ? onToggle : undefined}
        disabled={!isCollapsible}
      >
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {isCollapsible && (
          <Ionicons
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={UI.textMuted}
          />
        )}
      </Pressable>
      {showModules &&
        modules.map((mod, i) => (
          <Pressable
            key={mod.route + i}
            style={({ pressed }) => [styles.moduleCard, pressed && styles.moduleCardPressed]}
            onPress={() => onModulePress(mod.route)}
          >
            <View style={[styles.moduleIconWrap, { backgroundColor: `${domainColor}15` }]}>
              <Ionicons
                name={(mod.icon as keyof typeof Ionicons.glyphMap) || 'document'}
                size={22}
                color={domainColor}
              />
            </View>
            <View style={styles.moduleBody}>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              {mod.description ? (
                <Text style={styles.moduleDesc} numberOfLines={2}>
                  {mod.description}
                </Text>
              ) : null}
              {mod.badge ? (
                <View style={[styles.badge, { backgroundColor: `${domainColor}20` }]}>
                  <Text style={[styles.badgeText, { color: domainColor }]}>{mod.badge}</Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={UI.textMuted} />
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI.spacing * 2,
    paddingTop: 56,
    paddingBottom: UI.spacing * 2,
    backgroundColor: UI.card,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderLeftColor: UI.textMuted,
  },
  backBtn: { padding: UI.spacing, marginRight: UI.spacing },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: UI.spacing * 2 },
  domainIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: UI.text },
  scroll: { flex: 1 },
  scrollContent: { padding: UI.spacing * 3, paddingBottom: UI.spacing * 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: UI.textMuted },
  sectionWrap: { marginBottom: UI.spacing * 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: UI.spacing * 2,
    paddingVertical: UI.spacing,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UI.textMuted,
    letterSpacing: 0.3,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.card,
    borderRadius: UI.radius,
    padding: UI.spacing * 3,
    marginBottom: UI.spacing * 2,
    ...UI.shadow,
  },
  moduleCardPressed: { opacity: 0.9 },
  moduleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: UI.spacing * 2,
  },
  moduleBody: { flex: 1, minWidth: 0 },
  moduleTitle: { fontSize: 16, fontWeight: '600', color: UI.text },
  moduleDesc: { fontSize: 13, color: UI.textMuted, marginTop: 2 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  bottomPad: { height: UI.spacing * 4 },
});
