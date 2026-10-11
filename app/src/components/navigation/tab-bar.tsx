import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CreateActionSheet } from '@/components/create/create-action-sheet';
import { AppText } from '@/components/ui/app-text';
import type { IconName } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Fonts, Spacing } from '@/theme/tokens';

const TABS: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  index: { label: 'Explore', icon: 'map-outline', activeIcon: 'map' },
  discover: { label: 'Discover', icon: 'grid-outline', activeIcon: 'grid' },
};

/** Explore · Create · Discover. Create opens an action sheet instead of a screen. */
export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const renderTab = (routeName: string) => {
    const index = state.routes.findIndex((r) => r.name === routeName);
    const route = state.routes[index];
    const tab = TABS[routeName];
    if (!route || !tab) return null;
    const focused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    };

    return (
      <PressableScale
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={tab.label}
        onPress={onPress}
        style={styles.tab}>
        <Ionicons name={focused ? tab.activeIcon : tab.icon} size={22} color={focused ? Colors.navy : Colors.textMuted} />
        <AppText style={[styles.label, { color: focused ? Colors.navy : Colors.textMuted }]}>{tab.label}</AppText>
      </PressableScale>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
      {renderTab('index')}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Create a postcard or scrapbook"
        onPress={() => setCreateOpen(true)}
        style={styles.tab}>
        <View style={styles.createButton}>
          <Ionicons name="add" size={28} color={Colors.white} />
        </View>
        <AppText style={[styles.label, styles.createLabel]}>Create</AppText>
      </PressableScale>
      {renderTab('discover')}
      <CreateActionSheet visible={createOpen} onClose={() => setCreateOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3, minHeight: 48 },
  label: { fontFamily: Fonts.sansMedium, fontSize: 11.5 },
  createButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: -22,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.surface,
  },
  createLabel: { color: Colors.navy },
});
