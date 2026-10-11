import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Banner } from '@/components/ui';
import { s } from '@/constants/styles';
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
  const [demoJoined, setDemoJoined] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<'invite' | 'accept' | 'demo' | null>(null);
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
    <SafeAreaView style={s.modalSafe}>
      <View style={s.detailTop}>
        <Pressable onPress={() => router.back()} style={s.backButton}>
          <Text style={s.backText}>{'←'}</Text>
        </Pressable>
        <Text style={s.eyebrow}>SHARE THE MAP</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={s.createPage} keyboardShouldPersistTaps="handled">
        <Text style={s.detailTitle}>Better with friends.</Text>
        <Text style={s.heroCopy}>
          Swap a code and your maps merge — their pins appear on yours, yours on theirs.
        </Text>

        {error ? <Banner text={error} /> : null}

        <View style={s.infoBox}>
          <Text style={s.sectionTitle}>Invite a friend</Text>
          {code ? (
            <Text selectable style={s.code}>
              {code}
            </Text>
          ) : null}
          <ActionButton
            label={code ? 'New code' : 'Create an invite code'}
            busy={busy === 'invite'}
            onPress={createInvite}
          />
          {code ? (
            <View style={s.optionRow}>
              <ActionButton
                secondary
                label="Copy"
                onPress={() => Clipboard.setStringAsync(code)}
              />
              <ActionButton
                secondary
                label="Share…"
                onPress={() =>
                  Share.share({
                    message: `Join my Unfold map — open the app and enter code ${code}`,
                  })
                }
              />
            </View>
          ) : null}
        </View>

        <Text style={s.formLabel}>JOIN SOMEONE&rsquo;S MAP</Text>
        <TextInput
          style={[s.formInput, { fontSize: 20, letterSpacing: 3, textAlign: 'center' }]}
          value={entered}
          onChangeText={setEntered}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="6-character code"
          placeholderTextColor="#81786E"
        />
        <View style={{ height: 10 }} />
        <ActionButton label="Join" busy={busy === 'accept'} onPress={accept} />
        {joined ? (
          <Banner
            tone="info"
            text={`You and ${joined.name ?? joined.email ?? 'your friend'} now share a map.`}
          />
        ) : null}

        <View style={[s.infoBox, { marginTop: 26 }]}>
          <Text style={s.sectionTitle}>Demo map</Text>
          <Text style={s.cardMeta}>
            Befriends all three seeded Atlanta accounts at once, so your map is populated
            immediately.
          </Text>
          <ActionButton
            secondary
            label="Join the demo map"
            busy={busy === 'demo'}
            onPress={joinDemo}
          />
          {demoJoined ? (
            <Banner tone="info" text={`Now sharing a map with ${demoJoined.join(', ')}.`} />
          ) : null}
          <Text style={s.smallNote}>
            Or enter MAYA01 / THEO01 / REN001 above to join one seeded account.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
