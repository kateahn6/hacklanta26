import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadges } from '@/components/cards/status-badges';
import { ScrapbookView } from '@/components/scrapbook/scrapbook-view';
import { Button } from '@/components/ui/button';
import { DeleteButton } from '@/components/ui/delete-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import { TopBar } from '@/components/ui/top-bar';
import { useNow } from '@/hooks/use-now';
import { scrapbookPlaceIds, toScrapbookItem } from '@/lib/feed';
import { useDeletePost } from '@/lib/use-delete-post';
import { canViewScrapbook, isOwn } from '@/lib/visibility';
import { useContent } from '@/store/content';
import { Colors, Spacing } from '@/theme/tokens';

export function ScrapbookDetailScreen() {
  const { id, justPublished } = useLocalSearchParams<{ id: string; justPublished?: string }>();
  const insets = useSafeAreaInsets();
  const content = useContent();
  const now = useNow();
  const { isSharedScrapbook } = useDeletePost();
  const scrapbook = content.scrapbookById.get(id);

  if (!scrapbook || !canViewScrapbook(scrapbook)) {
    return (
      <View style={styles.screen}>
        <TopBar />
        <EmptyState
          icon="albums-outline"
          title="Scrapbook not available"
          message="Its creator may have made it private."
          actionLabel="Back to Explore"
          onAction={() => router.navigate('/')}
        />
      </View>
    );
  }

  const item = toScrapbookItem(content, scrapbook);
  const own = isOwn(scrapbook);
  const canDelete = own && !isSharedScrapbook(scrapbook.id);
  const hasMapPlaces = [...scrapbookPlaceIds(scrapbook)].some((placeId) => content.placeById.get(placeId)?.coordinate);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxxl }}>
        <ScrapbookView
          title={scrapbook.title}
          description={scrapbook.description}
          city={scrapbook.city}
          categories={scrapbook.categories}
          cover={item.cover}
          media={item.media}
          author={item.author}
          isOwn={own}
          notice={
            justPublished ? (
              <Notice
                icon="checkmark-circle"
                message={
                  scrapbook.status === 'draft'
                    ? 'Draft saved. Only you can see it until you publish.'
                    : scrapbook.visibility === 'public'
                      ? 'Published! Your scrapbook now appears in Discover.'
                      : 'Saved privately. Only you can see it, under Your posts in Discover.'
                }
              />
            ) : null
          }
          meta={<StatusBadges item={scrapbook} now={now} />}
          actions={
            hasMapPlaces || own ? (
              <View style={styles.actions}>
                {hasMapPlaces ? (
                  <Button
                    label="See on map"
                    icon="map-outline"
                    variant="secondary"
                    flex
                    onPress={() => router.push({ pathname: '/map', params: { scrapbookId: scrapbook.id } })}
                  />
                ) : null}
                {own ? (
                  <Button
                    label="Edit"
                    icon="create-outline"
                    flex={!hasMapPlaces}
                    onPress={() => router.push({ pathname: '/create/scrapbook', params: { id: scrapbook.id } })}
                  />
                ) : null}
              </View>
            ) : null
          }
        />
      </ScrollView>
      <TopBar floating right={canDelete ? <DeleteButton kind="scrapbook" id={scrapbook.id} floating /> : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
});
