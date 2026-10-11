import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type LongPressEvent } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceSheet } from '@/components/place-sheet';
import { Banner } from '@/components/ui';
import { Colors, DEMO_REGION, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';

export default function MapScreen() {
  const { ready, session, profile, signOut } = useAuth();
  const { places, returning, loading, error, refresh } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showReturning, setShowReturning] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (ready && !session) router.replace('/login');
    }, [ready, session])
  );

  useFocusEffect(
    useCallback(() => {
      if (session) refresh();
      // Re-reads places and the returning ranking every time the map comes back
      // into focus, so a new entry shows up immediately.
    }, [refresh, session])
  );

  const returningById = useMemo(
    () => new Map(returning.map((r) => [r.id, r])),
    [returning]
  );
  const selected = places.find((p) => p.id === selectedId) ?? null;
  const top = returning[0];

  const onLongPress = (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedId(null);
    router.push({
      pathname: '/new-entry',
      params: { lat: String(latitude), lng: String(longitude) },
    });
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapView
        style={styles.map}
        initialRegion={DEMO_REGION}
        onLongPress={onLongPress}
        onPress={() => setSelectedId(null)}>
        {places.map((place) => {
          const rank = returningById.get(place.id);
          const highlight = showReturning && !!rank && rank.return_days > 0;
          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: Number(place.lat), longitude: Number(place.lng) }}
              title={place.name}
              description={
                highlight
                  ? `${rank.return_days} return days among friends`
                  : `${place.entries.length} entries`
              }
              pinColor={highlight ? Colors.returning : Colors.accent}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedId(place.id);
              }}
            />
          );
        })}
      </MapView>

      <SafeAreaView style={styles.topBar} pointerEvents="box-none">
        <View style={styles.topRow}>
          <View style={styles.brandCard}>
            <Text style={styles.brand}>Unfold</Text>
            <Text style={styles.who}>{profile.name ?? profile.email ?? 'Signed in'}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => router.push('/share')}>
            <Text style={styles.iconLabel}>Share</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={signOut}>
            <Text style={styles.iconLabel}>Sign out</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.toggle, showReturning && styles.toggleOn]}
          onPress={() => setShowReturning((v) => !v)}>
          <Text style={[styles.toggleLabel, showReturning && styles.toggleLabelOn]}>
            {showReturning ? '● Friends keep returning' : '○ Friends keep returning'}
          </Text>
        </Pressable>

        {showReturning && top ? (
          <View style={styles.rank}>
            <Text style={styles.rankTitle}>
              #1 {top.name} · {top.return_days} return days
            </Text>
            <Text style={styles.rankBody}>
              {top.repeat_friends} of {top.friend_count} friends went back. Green pins are the
              places your circle returns to.
            </Text>
          </View>
        ) : null}

        {error ? <Banner text={error} /> : null}
        {loading ? (
          <View style={styles.loadingPill}>
            <ActivityIndicator color={Colors.accent} size="small" />
            <Text style={styles.loadingText}>Loading the shared map…</Text>
          </View>
        ) : null}
      </SafeAreaView>

      {!selected && !loading && places.length === 0 ? (
        <View style={styles.emptyBar}>
          <Text style={styles.emptyTitle}>No pins on your map yet</Text>
          <Text style={styles.emptyBody}>
            Press and hold anywhere to drop your first pin — or open Share and tap
            &ldquo;Join the demo map&rdquo; to see the seeded Atlanta places.
          </Text>
        </View>
      ) : null}

      {!selected && places.length > 0 ? (
        <View style={styles.hintBar}>
          <Text style={styles.hint}>Press and hold the map to drop a pin</Text>
        </View>
      ) : null}

      {selected ? (
        <PlaceSheet
          place={selected}
          returning={returningById.get(selected.id)}
          onClose={() => setSelectedId(null)}
          onAddEntry={() =>
            router.push({
              pathname: '/new-entry',
              params: {
                place_id: selected.id,
                name: selected.name,
                lat: String(selected.lat),
                lng: String(selected.lng),
              },
            })
          }
          onPostcard={(entryId) =>
            router.push({ pathname: '/postcard', params: { entry_id: entryId } })
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paper },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.paper },
  map: { flex: 1 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, padding: Spacing.md, gap: Spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandCard: {
    flex: 1,
    backgroundColor: Colors.paper,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  brand: { fontSize: 18, fontWeight: '800', color: Colors.ink },
  who: { fontSize: 12, color: Colors.inkSoft },
  iconButton: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  iconLabel: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  toggle: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.paper,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  toggleOn: { backgroundColor: Colors.returning },
  toggleLabel: { fontSize: 13, fontWeight: '700', color: Colors.inkSoft },
  toggleLabelOn: { color: '#fff' },
  rank: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 2,
  },
  rankTitle: { fontSize: 15, fontWeight: '800', color: Colors.returning },
  rankBody: { fontSize: 12, lineHeight: 17, color: Colors.inkSoft },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.paper,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  loadingText: { fontSize: 12, color: Colors.inkSoft },
  hintBar: { position: 'absolute', bottom: Spacing.xl, left: 0, right: 0, alignItems: 'center' },
  emptyBar: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.paper,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.ink },
  emptyBody: { fontSize: 13, lineHeight: 19, color: Colors.inkSoft },
  hint: {
    backgroundColor: Colors.ink,
    color: Colors.paper,
    fontSize: 13,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    overflow: 'hidden',
  },
});
