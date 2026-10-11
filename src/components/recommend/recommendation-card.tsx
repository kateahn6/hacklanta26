import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PhotoView } from '@/components/ui/photo-view';
import { categoryById } from '@/data/categories';
import { openPostcard, openScrapbook } from '@/lib/navigation';
import type { Content } from '@/store/content';
import { Colors, Radius, Spacing } from '@/theme/tokens';
import type { Recommendation } from '@/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  content: Content;
  index: number;
}

export function RecommendationCard({ recommendation, content, index }: RecommendationCardProps) {
  const place = content.placeById.get(recommendation.placeId);
  if (!place) return null;
  const postcard = recommendation.postcardId ? content.postcardById.get(recommendation.postcardId) : undefined;
  const scrapbook = recommendation.scrapbookId ? content.scrapbookById.get(recommendation.scrapbookId) : undefined;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <PhotoView photo={postcard?.photo ?? null} aspect={1} style={styles.photo} />
        <View style={styles.text}>
          <AppText variant="overline">
            {index + 1} · {place.categories.map((c) => categoryById(c).label).join(' · ')}
          </AppText>
          <AppText variant="subheading">{place.name}</AppText>
          <AppText variant="caption">{place.neighborhood}</AppText>
        </View>
      </View>
      <AppText variant="body" color={Colors.chocolate}>
        {recommendation.reason}
      </AppText>
      <View style={styles.actions}>
        {place.coordinate ? (
          <Button
            label="Show on map"
            icon="map-outline"
            variant="secondary"
            flex
            onPress={() => router.push({ pathname: '/map', params: { placeId: place.id } })}
          />
        ) : null}
        {postcard ? (
          <Button label="Postcard" icon="mail-open-outline" variant="ghost" onPress={() => openPostcard(postcard.id)} />
        ) : null}
        {scrapbook ? (
          <Button label="Scrapbook" icon="albums-outline" variant="ghost" onPress={() => openScrapbook(scrapbook.id)} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.paper },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  photo: { width: 64, borderRadius: Radius.sm },
  text: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.xs },
});
