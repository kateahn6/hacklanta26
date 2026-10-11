import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '@/theme/tokens';
import type { Photo } from '@/types';

interface PhotoViewProps {
  photo: Photo | null;
  style?: StyleProp<ViewStyle>;
  /** Overrides the photo's own aspect ratio. */
  aspect?: number;
  label?: string;
}

export function PhotoView({ photo, style, aspect, label }: PhotoViewProps) {
  const ratio = aspect ?? photo?.aspect ?? 1;
  if (!photo) {
    return (
      <View style={[styles.empty, { aspectRatio: ratio }, style]} accessibilityLabel="No photo">
        <Ionicons name="image-outline" size={26} color={Colors.textMuted} />
      </View>
    );
  }
  return (
    <Image
      source={photo.source}
      style={[{ aspectRatio: ratio }, style as object]}
      contentFit="cover"
      transition={200}
      accessibilityLabel={label}
    />
  );
}

const styles = StyleSheet.create({
  empty: { backgroundColor: Colors.backgroundDeep, alignItems: 'center', justifyContent: 'center' },
});
