import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Label, Tag } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Place, ReturningPlace } from '@/lib/types';

function when(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.round(days / 30)} mo ago`;
}

export function PlaceSheet({
  place,
  returning,
  onClose,
  onAddEntry,
  onPostcard,
}: {
  place: Place;
  returning?: ReturningPlace;
  onClose: () => void;
  onAddEntry: () => void;
  onPostcard: (entryId: string) => void;
}) {
  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{place.name}</Text>
          <Text style={styles.subtitle}>
            {place.entries.length} {place.entries.length === 1 ? 'entry' : 'entries'} · added by{' '}
            {place.created_by_name ?? 'a friend'}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      {returning && returning.return_days > 0 ? (
        <View style={styles.returning}>
          <Text style={styles.returningText}>
            {returning.who.join(', ')} kept coming back — {returning.return_days} return
            {returning.return_days === 1 ? ' day' : ' days'}
          </Text>
        </View>
      ) : null}

      <ScrollView style={styles.entries} contentContainerStyle={styles.entriesContent}>
        {place.entries.length === 0 ? (
          <Text style={styles.empty}>No entries yet. Be the first to unfold this one.</Text>
        ) : null}
        {place.entries.map((entry) => (
          <View key={entry.id} style={styles.entry}>
            {entry.photo_urls.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photos}>
                {entry.photo_urls.map((uri, i) => (
                  <Image
                    key={`${entry.id}-${i}`}
                    source={{ uri }}
                    style={styles.photo}
                    contentFit="cover"
                    transition={120}
                  />
                ))}
              </ScrollView>
            ) : null}
            <Label>
              {entry.user_name ?? 'A friend'} · {when(entry.created_at)}
            </Label>
            {entry.caption ? <Text style={styles.caption}>{entry.caption}</Text> : null}
            {entry.story ? <Text style={styles.story}>{entry.story}</Text> : null}
            {entry.tags.length > 0 ? (
              <View style={styles.tags}>
                {entry.tags.map((tag) => (
                  <Tag key={`${entry.id}-${tag}`} label={tag} />
                ))}
              </View>
            ) : null}
            {entry.postcard_text ? (
              <Button
                variant="secondary"
                label="Send as postcard"
                onPress={() => onPostcard(entry.id)}
              />
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Button label="Add your entry here" onPress={onAddEntry} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '68%',
    backgroundColor: Colors.paper,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Colors.line,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.ink },
  subtitle: { fontSize: 13, color: Colors.inkSoft, marginTop: 2 },
  close: { fontSize: 15, fontWeight: '600', color: Colors.accent },
  returning: {
    backgroundColor: '#DFF1E9',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  returningText: { fontSize: 13, color: Colors.returning, fontWeight: '600' },
  entries: { flexGrow: 0 },
  entriesContent: { gap: Spacing.md, paddingBottom: Spacing.sm },
  empty: { fontSize: 14, color: Colors.inkSoft, paddingVertical: Spacing.md },
  entry: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  photos: { flexGrow: 0 },
  photo: {
    width: 150,
    height: 190,
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.line,
  },
  caption: { fontSize: 17, fontWeight: '700', color: Colors.ink, lineHeight: 23 },
  story: { fontSize: 15, lineHeight: 22, color: Colors.inkSoft },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
});
