import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Share, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useData } from '@/lib/data';

export default function PostcardScreen() {
  const { entry_id } = useLocalSearchParams<{ entry_id?: string }>();
  const { findEntry } = useData();
  const found = entry_id ? findEntry(entry_id) : null;

  if (!found) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>That entry is no longer on the map.</Text>
      </View>
    );
  }

  const { entry, place } = found;
  const photo = entry.photo_urls[0];
  const message =
    entry.postcard_text ?? entry.caption ?? `Thinking of you from ${place.name}.`;

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]} />
        )}
        <View style={styles.overlay}>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.from}>
            — {entry.user_name ?? 'a friend'}, {place.name}
          </Text>
        </View>
        <Text style={styles.stamp}>UNFOLD</Text>
      </View>

      <Button
        label="Send this postcard"
        onPress={() =>
          Share.share({ message: `${message}\n\n— from ${place.name}, via Unfold` })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paper, padding: Spacing.md, gap: Spacing.md },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.paper },
  missingText: { color: Colors.inkSoft, fontSize: 15 },
  card: {
    flex: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.ink,
  },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  photoEmpty: { backgroundColor: Colors.inkSoft },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: 'rgba(28,26,23,0.55)',
  },
  message: { color: '#fff', fontSize: 22, lineHeight: 29, fontWeight: '600' },
  from: { color: '#F0E6D8', fontSize: 14 },
  stamp: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
});
