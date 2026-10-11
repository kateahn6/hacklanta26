import type { User } from '@/types';

/** The person using this demo build. Content they create is stored on this device only. */
export const DEMO_USER_ID = 'u-demo';

export const users: User[] = [
  { id: DEMO_USER_ID, name: 'Lucky-Comet-5150', neighborhood: 'Inman Park' },
  { id: 'u-maya', name: 'Golden-Heron-1042', neighborhood: 'Midtown' },
  { id: 'u-theo', name: 'Breezy-Fox-2718', neighborhood: 'Old Fourth Ward' },
  { id: 'u-priya', name: 'Velvet-Maple-3307', neighborhood: 'Virginia-Highland' },
  { id: 'u-marcus', name: 'Quiet-Badger-0921', neighborhood: 'East Atlanta' },
  { id: 'u-lena', name: 'Witty-Lark-6634', neighborhood: 'Little Five Points' },
  { id: 'u-sam', name: 'Mellow-Finch-4486', neighborhood: 'Grant Park' },
];
