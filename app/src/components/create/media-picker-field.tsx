import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { newId } from '@/lib/format';
import { Colors, Fonts, Radius, Spacing } from '@/theme/tokens';
import type { ScrapbookMedia } from '@/types';

const MAX_PHOTOS = 30;
export const CAPTION_LIMIT = 80;

interface MediaPickerFieldProps {
  media: ScrapbookMedia[];
  onChange: (media: ScrapbookMedia[]) => void;
  invalid?: boolean;
  /** Photos someone else added to a shared scrapbook: shown, but their caption and removal are locked. */
  isLocked?: (media: ScrapbookMedia) => boolean;
  /** Label for a locked photo's author, e.g. "Added by Maya". */
  lockedLabel?: (media: ScrapbookMedia) => string;
}

/** Adds several photos at once, each with an optional short caption. Cancel or failure keeps what's there. */
export function MediaPickerField({ media, onChange, invalid, isLocked, lockedLabel }: MediaPickerFieldProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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

  const setCaption = (id: string, caption: string) =>
    onChange(media.map((m) => (m.id === id ? { ...m, caption: caption.length > 0 ? caption : undefined } : m)));

  return (
    <View style={styles.wrap}>
      {media.length > 0 ? (
        <View style={styles.list}>
          {media.map((m, index) =>
            isLocked?.(m) ? (
              <View key={m.id} style={styles.row}>
                <PhotoView photo={m.photo} aspect={1} style={styles.thumb} label={`Photo ${index + 1}`} />
                <View style={styles.lockedText}>
                  <AppText variant="caption" numberOfLines={2} style={styles.lockedCaption}>
                    {m.caption ?? 'No caption'}
                  </AppText>
                  <AppText variant="caption">{lockedLabel?.(m) ?? 'Added by a friend'}</AppText>
                </View>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />
              </View>
            ) : (
            <View key={m.id} style={styles.row}>
              <PhotoView photo={m.photo} aspect={1} style={styles.thumb} label={`Photo ${index + 1}`} />
              <TextInput
                value={m.caption ?? ''}
                onChangeText={(text) => setCaption(m.id, text)}
                placeholder="Add a caption (optional)"
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel={`Caption for photo ${index + 1}`}
                maxLength={CAPTION_LIMIT}
                multiline
                style={styles.caption}
              />
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${index + 1}`}
                hitSlop={8}
                onPress={() => onChange(media.filter((x) => x.id !== m.id))}
                style={styles.remove}>
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </PressableScale>
            </View>
            ),
          )}
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
  list: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  thumb: { width: 64, borderRadius: Radius.sm },
  caption: {
    flex: 1,
    minHeight: 44,
    paddingVertical: Spacing.xs,
    fontFamily: Fonts.sansItalic,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.slate,
    textAlignVertical: 'center',
  },
  lockedText: { flex: 1, gap: 2 },
  lockedCaption: { fontFamily: Fonts.sansItalic, color: Colors.slate },
  remove: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundDeep },
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
