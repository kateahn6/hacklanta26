import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TopBar } from '@/components/ui/top-bar';
import { useNow } from '@/hooks/use-now';
import { type PostcardItem, toPostcardItem } from '@/lib/feed';
import { isOwn, isPostcardPublic } from '@/lib/visibility';
import { useAppStore } from '@/store/app-store';
import { useContent } from '@/store/content';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';

/** Choose existing postcards (yours or public ones) to add to the scrapbook being composed. */
export function PickPostcardsScreen() {
  const insets = useSafeAreaInsets();
  const content = useContent();
  const now = useNow();
  const composer = useAppStore((s) => s.composer);
  const addComposerStops = useAppStore((s) => s.addComposerStops);
  const [selected, setSelected] = useState<string[]>([]);

  const already = new Set(composer?.stops.map((s) => s.postcardId) ?? []);
  const available = content.postcards.filter((p) => p.status === 'published' && (isOwn(p) || isPostcardPublic(p, now)));
  const toItems = (own: boolean) =>
    available.filter((p) => isOwn(p) === own).flatMap((p) => toPostcardItem(content, p) ?? []);
  const sections = [
    { title: 'Your postcards', items: toItems(true) },
    { title: 'From the community', items: toItems(false) },
  ].filter((s) => s.items.length > 0);

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const done = () => {
    addComposerStops(selected);
    router.back();
  };

  if (!composer) {
    return (
      <View style={styles.screen}>
        <TopBar title="Add postcards" backIcon="close" />
        <EmptyState icon="albums-outline" title="No scrapbook open" message="Start a scrapbook first, then add postcards to it." />
      </View>
    );
  }

  const row = (item: PostcardItem) => {
    const added = already.has(item.postcard.id);
    const checked = added || selected.includes(item.postcard.id);
    return (
      <PressableScale
        key={item.key}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled: added }}
        accessibilityLabel={`${item.place.name} by ${item.author.name}${added ? ', already added' : ''}`}
        disabled={added}
        onPress={() => toggle(item.postcard.id)}
        style={[styles.row, checked && styles.rowChecked]}>
        <PhotoView photo={item.photo} aspect={1} style={styles.thumb} />
        <View style={styles.flex}>
          <AppText variant="label" numberOfLines={1}>
            {item.place.name}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {item.author.name} · {item.place.neighborhood || item.place.city}
          </AppText>
        </View>
        {added ? (
          <AppText variant="caption">Added</AppText>
        ) : (
          <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={checked ? Colors.cherry : Colors.muted} />
        )}
      </PressableScale>
    );
  };

  return (
    <View style={styles.screen}>
      <TopBar title="Add postcards" backIcon="close" />
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText variant="heading">{section.title}</AppText>
            {section.items.map(row)}
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button
          label={selected.length === 0 ? 'Select postcards' : `Add ${selected.length} ${selected.length === 1 ? 'postcard' : 'postcards'}`}
          onPress={done}
          disabled={selected.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  content: { paddingHorizontal: Gutter, paddingBottom: Spacing.xxl, gap: Spacing.xl },
  section: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.sm,
    paddingRight: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.paper,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowChecked: { borderColor: Colors.cherry },
  thumb: { width: 52, borderRadius: Radius.sm },
  footer: { paddingHorizontal: Gutter, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.hairline },
});
