import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { newId } from '@/lib/format';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';
import type { ScrapbookMedia } from '@/types';

const MAX_PHOTOS = 30;
const COLUMNS = 3;

interface MediaPickerFieldProps {
  media: ScrapbookMedia[];
  onChange: (media: ScrapbookMedia[]) => void;
  invalid?: boolean;
}

/** Adds several photos at once from the library. Cancel or failure keeps what's already there. */
export function MediaPickerField({ media, onChange, invalid }: MediaPickerFieldProps) {
  const { width } = useWindowDimensions();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tile = (width - Gutter * 2 - Spacing.sm * (COLUMNS - 1)) / COLUMNS;
  const remaining = MAX_PHOTOS - media.length;

  const add = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        orderedSelection: true,
        quality: 0.8,
      });
      if (result.canceled || result.assets.length === 0) {
        setMessage('No photos added. Everything else you entered is still here.');
        return;
      }
      const added = result.assets.slice(0, remaining).map((asset) => ({
        id: newId('m'),
        photo: { source: { uri: asset.uri }, aspect: asset.width && asset.height ? asset.width / asset.height : 1 },
      }));
      onChange([...media, ...added]);
    } catch {
      setMessage('Couldn’t open your photos. Check photo access for Expo Go in Settings, then try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {media.length > 0 ? (
        <View style={styles.grid}>
          {media.map((m, index) => (
            <View key={m.id} style={{ width: tile }}>
              <PhotoView photo={m.photo} aspect={1} style={styles.thumb} label={`Photo ${index + 1}`} />
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${index + 1}`}
                hitSlop={8}
                onPress={() => onChange(media.filter((x) => x.id !== m.id))}
                style={styles.remove}>
                <Ionicons name="close" size={14} color={Colors.white} />
              </PressableScale>
            </View>
          ))}
        </View>
      ) : (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Add photos"
          onPress={add}
          disabled={busy}
          style={[styles.empty, invalid && styles.invalid]}>
          <View style={styles.emptyIcon}>
            <Ionicons name="images-outline" size={26} color={Colors.navy} />
          </View>
          <AppText variant="label" color={Colors.navy}>
            {busy ? 'Opening photos…' : 'Add photos'}
          </AppText>
          <AppText variant="caption">Choose several at once from your library</AppText>
        </PressableScale>
      )}
      {media.length > 0 && remaining > 0 ? (
        <Button label="Add more photos" icon="add" variant="secondary" onPress={add} loading={busy} />
      ) : null}
      {message ? (
        <AppText variant="caption" color={Colors.slate} accessibilityRole="alert">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  thumb: { width: '100%', borderRadius: Radius.sm },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xxl,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.sky,
    backgroundColor: Colors.surface,
  },
  invalid: { borderColor: Colors.danger },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.navySoft, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
});
