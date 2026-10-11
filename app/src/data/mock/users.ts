import type { User } from '@/types';

/** The person using this demo build. Content they create is stored on this device only. */
export const DEMO_USER_ID = 'u-demo';

export const users: User[] = [
  { id: DEMO_USER_ID, name: 'Alex Rivera', handle: 'alexwanders', neighborhood: 'Inman Park' },
  { id: 'u-maya', name: 'Maya Chen', handle: 'mayamakes', neighborhood: 'Midtown' },
  { id: 'u-theo', name: 'Theo Okafor', handle: 'theo.walks', neighborhood: 'Old Fourth Ward' },
  { id: 'u-priya', name: 'Priya Shah', handle: 'priyapours', neighborhood: 'Virginia-Highland' },
  { id: 'u-marcus', name: 'Marcus Bell', handle: 'marcusbell', neighborhood: 'East Atlanta' },
  { id: 'u-lena', name: 'Lena Ortiz', handle: 'lenaonfoot', neighborhood: 'Little Five Points' },
  { id: 'u-sam', name: 'Sam Kim', handle: 'samseesatl', neighborhood: 'Grant Park' },
];
