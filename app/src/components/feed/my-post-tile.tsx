import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { StatusBadges } from '@/components/cards/status-badges';
import { AppText } from '@/components/ui/app-text';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { toScrapbookItem } from '@/lib/feed';
import type { Content } from '@/store/content';
import { Radius, Spacing } from '@/theme/tokens';
import type { Photo, Postcard, Scrapbook } from '@/types';

export interface MyPost {
  key: string;
  kind: 'postcard' | 'scrapbook';
  title: string;
  photo: Photo | null;
  item: Postcard | Scrapbook;
}

/** The demo user's postcards and scrapbooks, drafts and private ones included, newest first. */
export function buildMyPosts(content: Content, authorId: string): MyPost[] {
  const postcards: MyPost[] = content.postcards
    .filter((p) => p.authorId === authorId)
    .map((p) => ({
      key: `postcard:${p.id}`,
      kind: 'postcard',
      title: content.placeById.get(p.placeId)?.name ?? 'Untitled place',
      photo: p.photo,
      item: p,
    }));
  const scrapbooks: MyPost[] = content.scrapbooks
    // Includes scrapbooks you joined with a code.
    .filter((s) => s.authorId === authorId || (s.collaboratorIds ?? []).includes(authorId))
    .map((s) => ({
      key: `scrapbook:${s.id}`,
      kind: 'scrapbook',
      title: s.title,
      photo: toScrapbookItem(content, s).cover,
      item: s,
    }));
  return [...postcards, ...scrapbooks].sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt));
}

function open(post: MyPost) {
  const id = post.item.id;
  const draft = post.item.status === 'draft';
  if (post.kind === 'postcard') {
    router.push(draft ? { pathname: '/create/postcard', params: { id } } : { pathname: '/postcard/[id]', params: { id } });
  } else {
    router.push(draft ? { pathname: '/create/scrapbook', params: { id } } : { pathname: '/scrapbook/[id]', params: { id } });
  }
}

export function MyPostTile({ post, width, now }: { post: MyPost; width: number; now: number }) {
  const draft = post.item.status === 'draft';
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${draft ? 'Edit draft' : 'Open'} ${post.kind}: ${post.title}`}
      onPress={() => open(post)}
      style={[styles.tile, { width }]}>
      <View style={styles.photoWrap}>
        <PhotoView photo={post.photo} aspect={0.95} style={styles.photo} />
        <View style={styles.badges}>
          <StatusBadges item={post.item} now={now} />
        </View>
      </View>
      <AppText variant="overline">{post.kind === 'postcard' ? 'Postcard' : 'Scrapbook'}</AppText>
      <AppText variant="label" numberOfLines={2}>
        {post.title}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: { gap: 3 },
  photoWrap: { borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.xs },
  photo: { width: '100%' },
  badges: { position: 'absolute', left: 6, right: 6, bottom: 6 },
});
