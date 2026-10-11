import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadges } from '@/components/cards/status-badges';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import { PhotoView } from '@/components/ui/photo-view';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopBar } from '@/components/ui/top-bar';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { DEMO_USER_ID } from '@/data/content-source';
import { useNow } from '@/hooks/use-now';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { toScrapbookItem } from '@/lib/feed';
import { useAppStore } from '@/store/app-store';
import { useContent } from '@/store/content';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';
import type { Photo, Postcard, Scrapbook } from '@/types';

type Tab = 'postcards' | 'scrapbooks' | 'drafts';

interface Row {
  key: string;
  title: string;
  subtitle: string;
  photo: Photo | null;
  item: Postcard | Scrapbook;
  onOpen: () => void;
  onToggleVisibility: () => void;
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const content = useContent();
  const now = useNow();
  const defaultVisibility = useAppStore((s) => s.defaultVisibility);
  const setDefaultVisibility = useAppStore((s) => s.setDefaultVisibility);
  const upsertPostcard = useAppStore((s) => s.upsertPostcard);
  const upsertScrapbook = useAppStore((s) => s.upsertScrapbook);
  const [tab, setTab] = useState<Tab>('postcards');
  const { profile, getAccessToken } = useAuth();
  const { refresh } = useData();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState<'invite' | 'demo' | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareDone, setShareDone] = useState<string | null>(null);

  const me = content.userById.get(DEMO_USER_ID);
  const flip = (v: 'public' | 'private') => (v === 'public' ? 'private' : 'public');

  const postcardRows: Row[] = content.postcards
    .filter((p) => p.authorId === DEMO_USER_ID)
    .map((p) => {
      const place = content.placeById.get(p.placeId);
      return {
        key: p.id,
        title: place?.name ?? 'Untitled place',
        subtitle: p.note || 'No note yet',
        photo: p.photo,
        item: p,
        onOpen: () =>
          p.status === 'draft'
            ? router.push({ pathname: '/create/postcard', params: { id: p.id } })
            : router.push({ pathname: '/postcard/[id]', params: { id: p.id } }),
        onToggleVisibility: () => upsertPostcard({ ...p, visibility: flip(p.visibility) }),
      };
    });
  const scrapbookRows: Row[] = content.scrapbooks
    .filter((s) => s.authorId === DEMO_USER_ID)
    .map((s) => {
      const item = toScrapbookItem(content, s, now);
      return {
        key: s.id,
        title: s.title,
        subtitle: `${item.stops.length} places`,
        photo: item.cover,
        item: s,
        onOpen: () =>
          s.status === 'draft'
            ? router.push({ pathname: '/create/scrapbook', params: { id: s.id } })
            : router.push({ pathname: '/scrapbook/[id]', params: { id: s.id } }),
        onToggleVisibility: () => upsertScrapbook({ ...s, visibility: flip(s.visibility) }),
      };
    });

  const all = [...postcardRows, ...scrapbookRows];
  const rows =
    tab === 'drafts'
      ? all.filter((r) => r.item.status === 'draft')
      : (tab === 'postcards' ? postcardRows : scrapbookRows).filter((r) => r.item.status === 'published');

  const createInvite = async () => {
    setShareBusy('invite');
    setShareError(null);
    try {
      const token = await getAccessToken();
      const res = await api<{ code: string }>('/api/friends/invite', {
        method: 'POST',
        token,
        profile,
      });
      setInviteCode(res.code);
      await Clipboard.setStringAsync(res.code);
      setShareDone(`Code ${res.code} copied. Send it to a friend.`);
    } catch (err: any) {
      setShareError(err?.message ?? 'Could not create an invite code.');
    } finally {
      setShareBusy(null);
    }
  };

  const shareInvite = () => {
    if (!inviteCode) return;
    Share.share({ message: `Join my noted! map — open the app and enter code ${inviteCode}` });
  };

  /** Befriends every seeded demo account, so the map fills up immediately. */
  const joinDemo = async () => {
    setShareBusy('demo');
    setShareError(null);
    try {
      const token = await getAccessToken();
      const res = await api<{ friends: { name: string | null }[] }>('/api/demo/befriend', {
        method: 'POST',
        token,
        profile,
      });
      await refresh();
      setShareDone(`Now sharing a map with ${res.friends.map((f) => f.name ?? 'a friend').join(', ')}.`);
    } catch (err: any) {
      setShareError(err?.message ?? 'Could not join the demo map.');
    } finally {
      setShareBusy(null);
    }
  };

  if (!me) return null;

  return (
    <View style={styles.screen}>
      <TopBar title="Profile" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}>
        <View style={styles.identity}>
          <Avatar user={me} size={76} />
          <AppText variant="title">{me.name}</AppText>
          <AppText variant="caption">
            @{me.handle} · {me.neighborhood}
          </AppText>
        </View>
        <Notice
          icon="people-outline"
          message="Your published postcards are shared with the friends on your map. Drafts stay on this device."
        />

        <View style={styles.section}>
          <AppText variant="heading">Your friends&rsquo; map</AppText>
          <AppText variant="caption">
            Swap a code and your maps merge — their pins appear on yours, and yours on theirs.
          </AppText>
          {inviteCode ? <AppText variant="display" style={styles.code}>{inviteCode}</AppText> : null}
          {shareError ? <Notice icon="warning-outline" tone="cherry" message={shareError} /> : null}
          {shareDone ? <Notice icon="checkmark-circle-outline" message={shareDone} /> : null}
          <Button
            label={inviteCode ? 'Share this code' : 'Create an invite code'}
            icon={inviteCode ? 'share-outline' : 'person-add-outline'}
            loading={shareBusy === 'invite'}
            onPress={inviteCode ? shareInvite : createInvite}
          />
          <Button
            label="Join the demo map"
            variant="secondary"
            icon="map-outline"
            loading={shareBusy === 'demo'}
            onPress={joinDemo}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="heading">Privacy</AppText>
          <AppText variant="caption">Default for new postcards and scrapbooks. You can change it on each one.</AppText>
          <VisibilitySelector value={defaultVisibility} onChange={setDefaultVisibility} />
        </View>

        <View style={styles.section}>
          <AppText variant="heading">Your posts</AppText>
          <SegmentedControl<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'postcards', label: 'Postcards' },
              { value: 'scrapbooks', label: 'Scrapbooks' },
              { value: 'drafts', label: 'Drafts' },
            ]}
          />
          {rows.length === 0 ? (
            <EmptyState
              icon={tab === 'drafts' ? 'create-outline' : 'mail-open-outline'}
              title={tab === 'drafts' ? 'No drafts' : `No ${tab} yet`}
              message="Use the Create button to share a place you love."
            />
          ) : (
            rows.map((row) => (
              <View key={row.key} style={styles.row}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${row.title}`}
                  onPress={row.onOpen}
                  style={styles.rowMain}>
                  <PhotoView photo={row.photo} aspect={1} style={styles.thumb} />
                  <View style={styles.flex}>
                    <AppText variant="label" numberOfLines={1}>
                      {row.title}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {row.subtitle}
                    </AppText>
                    <StatusBadges item={row.item} now={now} />
                  </View>
                </PressableScale>
                {row.item.status === 'published' ? (
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={row.item.visibility === 'public' ? `Make ${row.title} private` : `Make ${row.title} public`}
                    onPress={row.onToggleVisibility}
                    style={styles.toggle}>
                    <AppText variant="caption" color={Colors.cherry}>
                      {row.item.visibility === 'public' ? 'Make private' : 'Make public'}
                    </AppText>
                  </PressableScale>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1, gap: 2 },
  content: { paddingHorizontal: Gutter, gap: Spacing.xl },
  identity: { alignItems: 'center', gap: Spacing.xs },
  section: { gap: Spacing.md },
  code: { color: Colors.cherry, letterSpacing: 8, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.paper },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  thumb: { width: 56, borderRadius: Radius.sm },
  toggle: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.sm },
});
