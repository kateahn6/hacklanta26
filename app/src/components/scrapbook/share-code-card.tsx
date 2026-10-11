import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Colors, Fonts, Radius, Spacing } from '@/theme/tokens';
import type { User } from '@/types';

interface ShareCodeCardProps {
  accessCode: string;
  scrapbookTitle: string;
  collaborators?: User[];
  ownerId?: string;
}

/** A scrapbook's access code with Share and Copy, plus who has joined. */
export function ShareCodeCard({ accessCode, scrapbookTitle, collaborators = [], ownerId }: ShareCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const share = () =>
    Share.share({
      message: `Add your photos to my noted! scrapbook "${scrapbookTitle}". In noted!, tap Create → Join with a code, and enter ${accessCode}.`,
    });

  const copy = async () => {
    await Clipboard.setStringAsync(accessCode);
    setCopied(true);
  };

  return (
    <View style={styles.card}>
      <AppText variant="label">Invite friends to add photos</AppText>
      <AppText variant="caption">Anyone with this code can add their own photos and captions.</AppText>
      <AppText style={styles.code} accessibilityLabel={`Access code ${accessCode.split('').join(' ')}`} selectable>
        {accessCode}
      </AppText>
      <View style={styles.row}>
        <Button label="Share code" icon="share-outline" onPress={share} flex />
        <Button label={copied ? 'Copied' : 'Copy'} icon={copied ? 'checkmark' : 'copy-outline'} variant="secondary" onPress={copy} flex />
      </View>
      {collaborators.length > 0 ? (
        <View style={styles.people}>
          {collaborators.map((person) => (
            <View key={person.id} style={styles.person}>
              <Avatar user={person} size={24} />
              <AppText variant="caption" numberOfLines={1}>
                {person.name}
                {person.id === ownerId ? ' (owner)' : ''}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  code: {
    fontFamily: Fonts.sansBold,
    fontSize: 30,
    letterSpacing: 8,
    color: Colors.navy,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  person: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '48%' },
});
