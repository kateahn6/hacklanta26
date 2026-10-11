import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Radius, Spacing } from '@/theme/tokens';
import type { Photo } from '@/types';

interface PhotoPickerFieldProps {
  photo: Photo | null;
  onChange: (photo: Photo | null) => void;
  invalid?: boolean;
  emptyLabel?: string;
}

/** Picks one photo from the device library. Cancel or failure leaves the rest of the form untouched. */
export function PhotoPickerField({ photo, onChange, invalid, emptyLabel = 'Add a photo' }: PhotoPickerFieldProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset) {
        setMessage('No photo chosen. Everything else you entered is still here.');
        return;
      }
      onChange({ source: { uri: asset.uri }, aspect: asset.width && asset.height ? asset.width / asset.height : 1 });
    } catch {
      setMessage('Couldn’t open your photos. Check photo access for Expo Go in Settings, then try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {photo ? (
        <View style={styles.previewWrap}>
          <View style={styles.mat}>
            <PhotoView photo={photo} aspect={Math.min(1.4, Math.max(0.8, photo.aspect))} style={styles.preview} label="Selected photo" />
          </View>
          <View style={styles.previewActions}>
            <Button label="Change photo" icon="images-outline" variant="secondary" onPress={pick} loading={busy} flex />
            <Button label="Remove" variant="ghost" onPress={() => onChange(null)} />
          </View>
        </View>
      ) : (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={emptyLabel}
          onPress={pick}
          disabled={busy}
          style={[styles.empty, invalid && styles.invalid]}>
          <View style={styles.emptyIcon}>
            <Ionicons name="image-outline" size={26} color={Colors.navy} />
          </View>
          <AppText variant="label" color={Colors.navy}>
            {busy ? 'Opening photos…' : emptyLabel}
          </AppText>
          <AppText variant="caption">Choose from your photo library</AppText>
        </PressableScale>
      )}
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
  previewWrap: { gap: Spacing.md },
  mat: { padding: 6, paddingBottom: 16, backgroundColor: Colors.surface, borderRadius: Radius.sm, boxShadow: '0 3px 12px rgba(22, 44, 94, 0.12)' },
  preview: { width: '100%', borderRadius: 3 },
  previewActions: { flexDirection: 'row', gap: Spacing.sm },
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
