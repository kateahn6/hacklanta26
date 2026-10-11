import { DEMO_USER_ID } from '@/data/content-source';

/**
 * Who "me" is.
 *
 * The frontend was built against seed content, where the signed-in person was
 * always DEMO_USER_ID. With the live API the author of anything you create is
 * your Auth0 `sub`, so ownership checks, "your posts" and the author shown on
 * a preview all have to use that instead.
 *
 * Kept as a module value rather than context because `isOwn` is called from
 * plain helpers (lib/visibility, lib/feed) that have no access to hooks.
 */
let currentId: string = DEMO_USER_ID;

export function setCurrentUserId(id: string | null | undefined): void {
  currentId = id && id.length > 0 ? id : DEMO_USER_ID;
}

export function currentUserId(): string {
  return currentId;
}
