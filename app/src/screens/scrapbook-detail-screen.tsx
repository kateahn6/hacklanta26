import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadges } from '@/components/cards/status-badges';
import { GetCodeCard } from '@/components/scrapbook/get-code-card';
import { ScrapbookView } from '@/components/scrapbook/scrapbook-view';
import { ShareCodeCard } from '@/components/scrapbook/share-code-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteButton } from '@/components/ui/delete-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import { TopBar } from '@/components/ui/top-bar';
import { useNow } from '@/hooks/use-now';
import { scrapbookPlaceIds, toScrapbookItem } from '@/lib/feed';
import { useDeletePost } from '@/lib/use-delete-post';
import { canViewScrapbook, isCollaborator, isOwn } from '@/lib/visibility';
import { useContent } from '@/store/content';
import { Colors, Spacing } from '@/theme/tokens';
import type { User } from '@/types';

export function ScrapbookDetailScreen() {
  const { id, justPublished, joined } = useLocalSearchParams<{ id: string; justPublished?: string; joined?: string }>();
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
  const canAddPhotos = isCollaborator(scrapbook) && !isSharedScrapbook(scrapbook.id);
  const peopleCount = scrapbook.collaboratorIds?.length ?? 0;
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
            joined ? (
              <Notice icon="people" message="You joined this scrapbook. Tap Add photos to add yours." />
            ) : justPublished ? (
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
          meta={
            <View style={styles.meta}>
              {peopleCount > 1 ? <Badge label={`Shared · ${peopleCount} people`} icon="people" tone="navy" /> : null}
              <StatusBadges item={scrapbook} now={now} />
            </View>
          }
          actions={
            <>
            {hasMapPlaces || canAddPhotos ? (
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
                {canAddPhotos ? (
                  <Button
                    label={own ? 'Edit' : 'Add photos'}
                    icon={own ? 'create-outline' : 'add'}
                    flex={!hasMapPlaces}
                    onPress={() => router.push({ pathname: '/create/scrapbook', params: { id: scrapbook.id } })}
                  />
                ) : null}
              </View>
            ) : null}
            {scrapbook.accessCode ? (
              <ShareCodeCard
                accessCode={scrapbook.accessCode}
                scrapbookTitle={scrapbook.title}
                collaborators={(scrapbook.collaboratorIds ?? [])
                  .map((userId) => content.userById.get(userId))
                  .filter((u): u is User => u !== undefined)}
                ownerId={scrapbook.authorId}
              />
            ) : own && !isSharedScrapbook(scrapbook.id) ? (
              <GetCodeCard scrapbook={scrapbook} />
            ) : null}
            </>
          }
        />
      </ScrollView>
      <TopBar floating right={canDelete ? <DeleteButton kind="scrapbook" id={scrapbook.id} floating /> : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  meta: { alignItems: 'flex-end', gap: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
});
