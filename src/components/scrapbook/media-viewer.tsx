import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import type { Content } from '@/store/content';
import { Colors, Gutter, Spacing } from '@/theme/tokens';
import type { ScrapbookMedia } from '@/types';

interface MediaViewerProps {
  media: ScrapbookMedia[];
  index: number | null;
  content: Content;
  onChangeIndex: (index: number | null) => void;
}

/** Full-screen view of one scrapbook image, with previous/next and an optional map link. */
export function MediaViewer({ media, index, content, onChangeIndex }: MediaViewerProps) {
  const insets = useSafeAreaInsets();
  const current = index === null ? undefined : media[index];
  const place = current?.placeId ? content.placeById.get(current.placeId) : undefined;
  const close = () => onChangeIndex(null);

  return (
    <Modal visible={current !== undefined} animationType="fade" onRequestClose={close} statusBarTranslucent>
      {current && index !== null ? (
        <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.top}>
            <AppText variant="caption" color={Colors.sage}>
              {index + 1} of {media.length}
            </AppText>
            <IconButton icon="close" label="Close photo" onPress={close} variant="paper" />
          </View>
          <Image source={current.photo.source} style={styles.image} contentFit="contain" accessibilityLabel={current.caption ?? 'Scrapbook photo'} />
          <View style={styles.bottom}>
            {current.caption ? (
              <AppText variant="note" color={Colors.cream} style={styles.center}>
                {current.caption}
              </AppText>
            ) : null}
            {place ? (
              <AppText variant="caption" color={Colors.sage} style={styles.center}>
                {place.name} · {place.neighborhood}
              </AppText>
            ) : null}
            <View style={styles.controls}>
              <IconButton
                icon="chevron-back"
                label="Previous photo"
                variant="paper"
                onPress={() => onChangeIndex((index - 1 + media.length) % media.length)}
              />
              {place?.coordinate ? (
                <Button
                  label="View on map"
                  icon="map-outline"
                  onPress={() => {
                    close();
                    router.push({ pathname: '/map', params: { placeId: place.id } });
                  }}
                />
              ) : (
                <View />
              )}
              <IconButton
                icon="chevron-forward"
                label="Next photo"
                variant="paper"
                onPress={() => onChangeIndex((index + 1) % media.length)}
              />
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.softBlack, gap: Spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Gutter },
  image: { flex: 1, width: '100%' },
  bottom: { gap: Spacing.sm, paddingHorizontal: Gutter },
  center: { textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
});
