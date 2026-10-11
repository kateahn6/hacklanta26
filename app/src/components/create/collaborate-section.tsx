import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ShareCodeCard } from '@/components/scrapbook/share-code-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Spacing } from '@/theme/tokens';
import type { User } from '@/types';

interface CollaborateSectionProps {
  /** Signed in with an API configured. Sharing needs the server. */
  online: boolean;
  scrapbookTitle: string;
  /** Present once the scrapbook is shared and you are a member. */
  accessCode?: string;
  collaborators: User[];
  ownerId?: string;
  /** Offer a link to the join screen. Only when starting a new scrapbook. */
  showJoinLink?: boolean;
}

/** Inviting friends from the scrapbook form. Joining has its own screen (/join). */
export function CollaborateSection({ online, scrapbookTitle, accessCode, collaborators, ownerId, showJoinLink }: CollaborateSectionProps) {
  if (!online) {
    return <Notice icon="people-outline" tone="slate" message="Sign in to invite friends to a scrapbook or join one with a code." />;
  }

  return (
    <View style={styles.wrap}>
      {accessCode ? (
        <ShareCodeCard accessCode={accessCode} scrapbookTitle={scrapbookTitle} collaborators={collaborators} ownerId={ownerId} />
      ) : (
        <AppText variant="caption">
          Post this scrapbook to get a 6-character access code. Friends who enter it can add their own photos.
        </AppText>
      )}
      {showJoinLink ? (
        <Button
          label="Have a code? Join a friend’s scrapbook"
          icon="key-outline"
          variant="secondary"
          onPress={() => router.push('/join')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
});
