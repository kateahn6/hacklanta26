import { router } from 'expo-router';
import { Alert } from 'react-native';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { useAppStore } from '@/store/app-store';

export type PostKind = 'postcard' | 'scrapbook';

/** After deleting, land on Discover, where "Your posts" lives. */
function leaveAfterDelete() {
  if (router.canDismiss()) router.dismissAll();
  router.navigate('/discover');
}

/**
 * Deleting your own posts. Published postcards live in the API and are deleted
 * there; seed and device-local posts are hidden on this device.
 */
export function useDeletePost() {
  const { places, scrapbooks, findEntry, refresh } = useData();
  const { getAccessToken, profile } = useAuth();
  const markDeleted = useAppStore((s) => s.markDeleted);

  /** A place several friends wrote about appears as a shared scrapbook. It isn't one person's to delete. */
  const isSharedScrapbook = (id: string) => places.some((place) => `sb-${place.id}` === id);

  const remove = async (kind: PostKind, id: string) => {
    const remotePath =
      kind === 'postcard' && findEntry(id)
        ? `/api/entries/${id}`
        : kind === 'scrapbook' && scrapbooks.some((s) => s.id === id)
          ? `/api/scrapbooks/${id}`
          : null;
    if (remotePath) {
      const token = await getAccessToken();
      await api(remotePath, { method: 'DELETE', token, profile });
      markDeleted(id);
      await refresh();
    } else {
      markDeleted(id);
    }
  };

  const confirmDelete = (kind: PostKind, id: string) => {
    Alert.alert(`Delete this ${kind}?`, 'It will be removed for everyone. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(kind, id);
            leaveAfterDelete();
          } catch (err) {
            Alert.alert('Couldn’t delete', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return { confirmDelete, isSharedScrapbook };
}
