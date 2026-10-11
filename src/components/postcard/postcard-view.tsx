import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { categoryById } from '@/data/categories';
import { Colors, Spacing } from '@/theme/tokens';
import type { Photo, Place, User } from '@/types';

import { FlipPostcard } from './flip-postcard';

interface PostcardViewProps {
  photo: Photo | null;
  note: string;
  place: Place;
  author: User;
  date: string;
  isOwn: boolean;
  /** Extra content under the author line, e.g. status badges. */
  meta?: ReactNode;
}

/** The postcard as everyone sees it. Shared by the detail screen and the pre-post preview. */
export function PostcardView({ photo, note, place, author, date, isOwn, meta }: PostcardViewProps) {
  return (
    <View style={styles.wrap}>
      <FlipPostcard photo={photo} note={note} signedBy={author.name.split(' ')[0]} place={place} date={date} />
      <View style={styles.titleBlock}>
        {place.categories.length > 0 ? (
          <AppText variant="overline">{place.categories.map((c) => categoryById(c).label).join(' · ')}</AppText>
        ) : null}
        <AppText variant="title">{place.name}</AppText>
        <AppText variant="body" color={Colors.textMuted}>
          {place.neighborhood ? `${place.neighborhood}, ` : ''}
          {place.city}
        </AppText>
        <View style={styles.author}>
          <Avatar user={author} size={28} />
          <View style={styles.flex}>
            <AppText variant="label">{isOwn ? `${author.name} (you)` : author.name}</AppText>
            <AppText variant="caption">@{author.handle}</AppText>
          </View>
        </View>
        {meta}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.lg },
  flex: { flex: 1 },
  titleBlock: { gap: Spacing.xs },
  author: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xs },
});
