import { MasonryGrid } from '@/components/ui/masonry-grid';
import { type FeedItem, itemAspect } from '@/lib/feed';

import { ExperienceCard } from './experience-card';

interface MasonryFeedProps {
  items: FeedItem[];
  now: number;
}

/** Two-column feed of postcards and scrapbooks. */
export function MasonryFeed({ items, now }: MasonryFeedProps) {
  return (
    <MasonryGrid
      items={items}
      keyOf={(item) => item.key}
      // Vary crops slightly so neighboring photos with the same ratio don't line up.
      aspectOf={(item, index) => itemAspect(item) * (index % 3 === 1 ? 0.82 : 1)}
      extraHeight={84}
      renderItem={(item, aspect) => <ExperienceCard item={item} aspect={aspect} now={now} />}
    />
  );
}
