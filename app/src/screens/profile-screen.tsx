import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { InfoTile } from '@/components/ui/info-tile';
import { Notice } from '@/components/ui/notice';
import { TopBar } from '@/components/ui/top-bar';
import { buildMyPosts } from '@/components/feed/my-post-tile';
import { DEMO_USER_ID } from '@/data/content-source';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { formatDate, timeSince } from '@/lib/format';
import { useContent } from '@/store/content';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const content = useContent();
  const { session, profile, signOut } = useAuth();
  const { username, memberSince, friendCount } = useData();

  const me = content.userById.get(DEMO_USER_ID);
  const name = username ?? me?.name ?? 'You';
  const posts = buildMyPosts(content, DEMO_USER_ID);
  const postcards = posts.filter((p) => p.kind === 'postcard').length;
  const scrapbooks = posts.filter((p) => p.kind === 'scrapbook');
  // Scrapbooks with more than one member: ones you shared, or joined with a code.
  const shared = content.scrapbooks.filter(
    (s) => (s.collaboratorIds ?? []).includes(DEMO_USER_ID) && (s.collaboratorIds?.length ?? 0) > 1
  ).length;
  const drafts = posts.filter((p) => p.item.status === 'draft').length;

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in any time. Drafts stay on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <View style={styles.screen}>
      <TopBar title="Profile" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <View style={styles.hero}>
          {me ? <Avatar user={{ ...me, name }} size={84} /> : null}
          <AppText variant="title" style={styles.center}>
            {name}
          </AppText>
          <AppText variant="body" color={Colors.textMuted} style={styles.center}>
            {memberSince
              ? `Member for ${timeSince(memberSince)} · joined ${formatDate(memberSince)}`
              : session
                ? 'Loading your membership…'
                : 'Not signed in'}
          </AppText>
        </View>

        <View style={styles.stats}>
          <InfoTile icon="mail-outline" label="Postcards" value={String(postcards)} />
          <InfoTile icon="albums-outline" label="Scrapbooks" value={String(scrapbooks.length)} />
        </View>
        <View style={styles.stats}>
          <InfoTile icon="people-outline" label="Shared scrapbooks" value={String(shared)} />
          <InfoTile icon="heart-outline" label="Friends" value={String(friendCount)} />
        </View>
        {drafts > 0 ? (
          <AppText variant="caption" style={styles.center}>
            Includes {drafts} {drafts === 1 ? 'draft' : 'drafts'} saved on this device.
          </AppText>
        ) : null}

        <Notice
          icon="shield-checkmark-outline"
          tone="slate"
          message={`Everyone sees you as ${name}. Your real name is never stored or shown.`}
        />

        {profile.email ? (
          <View style={styles.row}>
            <AppText variant="caption">Signed in as</AppText>
            <AppText variant="label" numberOfLines={1}>
              {profile.email}
            </AppText>
            <AppText variant="caption">Only you can see this.</AppText>
          </View>
        ) : null}

        {session ? <Button label="Sign out" icon="log-out-outline" variant="secondary" onPress={confirmSignOut} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Gutter, gap: Spacing.lg },
  hero: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  center: { textAlign: 'center' },
  stats: { flexDirection: 'row', gap: Spacing.sm },
  row: { gap: 2, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.hairline },
});
