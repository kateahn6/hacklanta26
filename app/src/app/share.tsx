import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { Banner, Button, Label } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';

type Friend = { id: string; name: string | null; email: string | null };

export default function ShareScreen() {
  const { profile, getAccessToken } = useAuth();
  const { refresh } = useData();
  const [code, setCode] = useState<string | null>(null);
  const [entered, setEntered] = useState('');
  const [joined, setJoined] = useState<Friend | null>(null);
  const [busy, setBusy] = useState<'invite' | 'accept' | 'demo' | null>(null);
  const [demoJoined, setDemoJoined] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createInvite = async () => {
    setBusy('invite');
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await api<{ code: string }>('/api/friends/invite', {
        method: 'POST',
        token,
        profile,
      });
      setCode(res.code);
    } catch (err: any) {
      setError(err?.message ?? 'Could not create an invite');
    } finally {
      setBusy(null);
    }
  };

  const accept = async () => {
    if (!entered.trim()) return;
    setBusy('accept');
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await api<{ friend: Friend }>('/api/friends/accept', {
        method: 'POST',
        token,
        profile,
        body: { code: entered.trim() },
      });
      setJoined(res.friend);
      setEntered('');
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Could not join that map');
    } finally {
      setBusy(null);
    }
  };

  const joinDemo = async () => {
    setBusy('demo');
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await api<{ friends: Friend[] }>('/api/demo/befriend', {
        method: 'POST',
        token,
        profile,
      });
      setDemoJoined(res.friends.map((f) => f.name ?? f.id));
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Could not join the demo map');
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {error ? <Banner text={error} /> : null}

      <View style={styles.block}>
        <Label>Invite a friend</Label>
        <Text style={styles.body}>
          Send them this code. When they type it in, both of your maps merge — their pins show up
          on yours and yours on theirs.
        </Text>
        {code ? <Text selectable style={styles.code}>{code}</Text> : null}
        <Button
          label={code ? 'New code' : 'Create an invite code'}
          busy={busy === 'invite'}
          onPress={createInvite}
        />
        {code ? (
          <>
            <Button
              variant="secondary"
              label="Copy code"
              onPress={() => Clipboard.setStringAsync(code)}
            />
            <Button
              variant="secondary"
              label="Share…"
              onPress={() =>
                Share.share({
                  message: `Join my Unfold map — open the app and enter code ${code}`,
                })
              }
            />
          </>
        ) : null}
      </View>

      <View style={styles.block}>
        <Label>Join someone&apos;s map</Label>
        <TextInput
          style={styles.input}
          value={entered}
          onChangeText={setEntered}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="6-character code"
          placeholderTextColor={Colors.inkSoft}
        />
        <Button label="Join" busy={busy === 'accept'} onPress={accept} />
        {joined ? (
          <Banner
            tone="info"
            text={`You and ${joined.name ?? joined.email ?? 'your friend'} now share a map.`}
          />
        ) : null}
        <Text style={styles.hint}>
          Or enter MAYA01 / THEO01 / REN001 to join one seeded account.
        </Text>
      </View>

      <View style={styles.block}>
        <Label>Demo map</Label>
        <Text style={styles.body}>
          Befriends all three seeded Atlanta accounts at once, so your map is
          populated immediately.
        </Text>
        <Button
          variant="secondary"
          label="Join the demo map"
          busy={busy === 'demo'}
          onPress={joinDemo}
        />
        {demoJoined ? (
          <Banner tone="info" text={`Now sharing a map with ${demoJoined.join(', ')}.`} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, gap: Spacing.md },
  block: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  body: { fontSize: 14, lineHeight: 20, color: Colors.inkSoft },
  code: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    color: Colors.accent,
    paddingVertical: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    fontSize: 20,
    letterSpacing: 3,
    textAlign: 'center',
    color: Colors.ink,
  },
  hint: { fontSize: 12, color: Colors.inkSoft },
});
