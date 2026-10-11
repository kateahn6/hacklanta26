import { type PostKind, useDeletePost } from '@/lib/use-delete-post';
import { Colors } from '@/theme/tokens';

import { IconButton } from './icon-button';

interface DeleteButtonProps {
  kind: PostKind;
  id: string;
  /** Use on top of photos. */
  floating?: boolean;
}

/** Trash button for your own postcard or scrapbook. Confirms before deleting. */
export function DeleteButton({ kind, id, floating }: DeleteButtonProps) {
  const { confirmDelete } = useDeletePost();
  return (
    <IconButton
      icon="trash-outline"
      label={`Delete this ${kind}`}
      onPress={() => confirmDelete(kind, id)}
      variant={floating ? 'surface' : 'clear'}
      iconColor={Colors.danger}
    />
  );
}
