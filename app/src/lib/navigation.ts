import { router } from 'expo-router';

import type { FeedItem } from './feed';

export function openItem(item: FeedItem) {
  if (item.kind === 'postcard') {
    router.push({ pathname: '/postcard/[id]', params: { id: item.postcard.id } });
  } else {
    router.push({ pathname: '/scrapbook/[id]', params: { id: item.scrapbook.id } });
  }
}

export const openPostcard = (id: string) => router.push({ pathname: '/postcard/[id]', params: { id } });
export const openScrapbook = (id: string) => router.push({ pathname: '/scrapbook/[id]', params: { id } });
