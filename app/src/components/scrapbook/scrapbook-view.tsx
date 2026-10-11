import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { MasonryGrid } from '@/components/ui/masonry-grid';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { categoryById } from '@/data/categories';
import { useContent } from '@/store/content';
import { Colors, Fonts, Gutter, Radius, Spacing } from '@/theme/tokens';
import type { CategoryId, Photo, ScrapbookMedia, User } from '@/types';

import { MediaViewer } from './media-viewer';

interface ScrapbookViewProps {
  title: string;
  description: string;
  city: string;
  categories: CategoryId[];
  /** Already resolved: the chosen cover or the first photo. */
  cover: Photo | null;
  media: ScrapbookMedia[];
  author: User;
  isOwn: boolean;
  /** Shown at the top of the sheet, e.g. a "Published!" notice. */
  notice?: ReactNode;
  /** Shown beside the author, e.g. status badges. */
  meta?: ReactNode;
  actions?: ReactNode;
}

/** The scrapbook as everyone sees it: cover, details, and a Pinterest-style photo grid with captions. */
export function ScrapbookView({ title, description, city, categories, cover, media, author, isOwn, notice, meta, actions }: ScrapbookViewProps) {
  const content = useContent();
  const [viewing, setViewing] = useState<number | null>(null);

  return (
    <View>
      <PhotoView photo={cover} aspect={1.25} style={styles.cover} label={`Cover of ${title}`} />

      <View style={styles.sheet}>
        {notice}
        <AppText variant="overline">
          Scrapbook · {city} · {media.length} {media.length === 1 ? 'photo' : 'photos'}
        </AppText>
        <AppText variant="title">{title}</AppText>
        {description ? (
          <AppText variant="body" color={Colors.slate}>
            {description}
          </AppText>
        ) : null}
        {categories.length > 0 ? (
          <View style={styles.tags}>
            {categories.map((c) => (
              <Badge key={c} label={categoryById(c).label} icon={categoryById(c).icon} />
            ))}
          </View>
        ) : null}
        <View style={styles.author}>
          <Avatar user={author} size={30} />
          <View style={styles.flex}>
            <AppText variant="label">{isOwn ? `${author.name} (you)` : author.name}</AppText>
          </View>
          {meta}
        </View>
        {actions}
      </View>

      {media.length === 0 ? (
        <EmptyState icon="images-outline" title="No photos yet" message="Add photos to bring this scrapbook to life." />
      ) : (
        <MasonryGrid
          items={media}
          keyOf={(m) => m.id}
          aspectOf={(m, index) => m.photo.aspect * (index % 3 === 1 ? 0.8 : 1)}
          extraHeight={28}
          rowGap={Spacing.md}
          renderItem={(m, aspect) => (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={m.caption ? `Open photo: ${m.caption}` : 'Open photo'}
              onPress={() => setViewing(media.indexOf(m))}
              style={styles.tile}>
              <PhotoView photo={m.photo} aspect={aspect} style={styles.tilePhoto} />
              {m.caption ? (
                <AppText numberOfLines={2} style={styles.caption}>
                  {m.caption}
                </AppText>
              ) : null}
            </PressableScale>
          )}
        />
      )}
      <MediaViewer media={media} index={viewing} content={content} onChangeIndex={setViewing} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cover: { width: '100%' },
  sheet: {
    marginTop: -Radius.xl,
    marginBottom: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    backgroundColor: Colors.background,
    paddingHorizontal: Gutter,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  author: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tile: { gap: 6 },
  tilePhoto: { width: '100%', borderRadius: Radius.md },
  caption: { fontFamily: Fonts.sansItalic, fontSize: 13, lineHeight: 18, color: Colors.slate, paddingHorizontal: 2 },
});
