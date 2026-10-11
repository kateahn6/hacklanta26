import type { FeedItem } from '@/lib/feed';
import { openItem } from '@/lib/navigation';

import { PostcardCard } from './postcard-card';
import { ScrapbookCard } from './scrapbook-card';

interface ExperienceCardProps {
  item: FeedItem;
  aspect: number;
  now: number;
}

export function ExperienceCard({ item, aspect, now }: ExperienceCardProps) {
  return item.kind === 'postcard' ? (
    <PostcardCard item={item} aspect={aspect} now={now} onPress={() => openItem(item)} />
  ) : (
    <ScrapbookCard item={item} aspect={aspect} now={now} onPress={() => openItem(item)} />
  );
}
