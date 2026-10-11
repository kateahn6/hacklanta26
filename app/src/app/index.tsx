import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Banner, Chip } from '@/components/ui';
import { s } from '@/constants/styles';
import { C, DEMO_REGION } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import type { Entry, Place, ReturningPlace } from '@/lib/types';

/** The photo a place leads with: the newest entry's first photo. */
function cover(place: Place): string | null {
  for (const entry of place.entries) {
    if (entry.photo_urls.length > 0) return entry.photo_urls[0];
  }
  return null;
}

function newest(place: Place): Entry | null {
  return place.entries[0] ?? null;
}

/** The prototype keyed its pins off a category; entry tags stand in for that. */
function pinFor(place: Place): string {
  const tags = place.entries.flatMap((e) => e.tags).join(' ').toLowerCase();
  if (/coffee|cafe|espresso|tea/.test(tags)) return '☕';
  if (/art|mural|gallery|museum/.test(tags)) return '✳';
  if (/park|trail|garden|nature|bench/.test(tags)) return '\u{1F33F}';
  if (/food|dinner|lunch|taco|pizza|market|bakery/.test(tags)) return '\u{1F374}';
  if (/music|show|band|loud/.test(tags)) return '♫';
  return '✦';
}

function when(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.round(days / 30)} mo ago`;
}

function ExperienceCard({
  place,
  rank,
  onPress,
}: {
  place: Place;
  rank?: ReturningPlace;
  onPress: () => void;
}) {
  const photo = cover(place);
  const entry = newest(place);
  const count = place.entries.length;
  return (
    <View style={s.card}>
      <Pressable onPress={onPress}>
        {photo ? (
          <Image source={{ uri: photo }} style={s.cardImage} contentFit="cover" transition={120} />
        ) : (
          <View style={s.cardImage} />
        )}
        {count > 1 ? (
          <View style={s.collectionTag}>
            <Text style={s.collectionTagText}>
              {'▧'}  {count} ENTRIES
            </Text>
          </View>
        ) : null}
        {rank && rank.return_days > 0 ? (
          <View style={s.returnTag}>
            <Text style={s.returnTagText}>{'↻'} {rank.return_days} BACK</Text>
          </View>
        ) : null}
      </Pressable>
      <View style={s.cardCopy}>
        <Pressable onPress={onPress}>
          <Text style={s.cardTitle}>{place.name}</Text>
        </Pressable>
        <Text numberOfLines={2} style={s.cardMeta}>
          {entry?.caption ?? 'No entry yet — be the first.'}
        </Text>
        <Text style={s.cardCreator}>
          {entry ? `A note from ${entry.user_name ?? 'a friend'}` : `Pinned by ${place.created_by_name ?? 'a friend'}`}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { ready, session, profile, signOut } = useAuth();
  const { places, returning, loading, error, refresh } = useData();

  const [tab, setTab] = useState<'Explore' | 'Returning'>('Explore');
  const [mode, setMode] = useState<'gallery' | 'map'>('gallery');
  const [tag, setTag] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapSelectedId, setMapSelectedId] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEMO_REGION);
  const [profileOpen, setProfileOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (ready && !session) router.replace('/login');
    }, [ready, session])
  );

  useFocusEffect(
    useCallback(() => {
      // Refetches whenever the map regains focus, so a just-saved entry shows up.
      if (session) refresh();
    }, [refresh, session])
  );

  const rankById = useMemo(() => new Map(returning.map((r) => [r.id, r])), [returning]);

  /** Filter chips come from the tags Gemini actually wrote onto the entries. */
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const place of places) {
      for (const entry of place.entries) {
        for (const t of entry.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return [
      'All',
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([t]) => t),
    ];
  }, [places]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return places.filter((place) => {
      const haystack = [
        place.name,
        ...place.entries.map((e) => `${e.caption ?? ''} ${e.story ?? ''} ${e.tags.join(' ')}`),
      ]
        .join(' ')
        .toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (tag !== 'All' && !place.entries.some((e) => e.tags.includes(tag))) return false;
      if (tab === 'Returning') {
        const rank = rankById.get(place.id);
        if (!rank || rank.return_days < 1) return false;
      }
      return true;
    });
  }, [places, query, rankById, tab, tag]);

  const columns = width > 700 ? 3 : 2;
  const cardWidth = (width - 48 - (columns - 1) * 12) / columns;

  const selected = places.find((p) => p.id === selectedId) ?? null;
  const mapSelected =
    places.find((p) => p.id === mapSelectedId) ?? visible[0] ?? places[0] ?? null;
  const initial = profile.name?.trim()?.[0]?.toUpperCase() ?? 'U';

  /** The + button pins wherever the map is currently centred. */
  const createHere = () => {
    router.push({
      pathname: '/new-entry',
      params: { lat: String(mapRegion.latitude), lng: String(mapRegion.longitude) },
    });
  };

  if (!ready) {
    return (
      <View style={[s.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={C.cherry} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.topBar}>
        <Pressable
          onPress={() => {
            setTab('Explore');
            setMode('gallery');
          }}>
          <Text style={s.logo}>
            noted<Text style={s.logoBang}>!</Text>
          </Text>
        </Pressable>
        <Text style={s.topTag}>REAL PLACES, REAL PEOPLE</Text>
        <Pressable style={s.avatar} onPress={() => setProfileOpen(true)}>
          {profile.picture ? (
            <Image source={{ uri: profile.picture }} style={{ width: 34, height: 34 }} />
          ) : (
            <Text style={s.avatarText}>{initial}</Text>
          )}
        </Pressable>
      </View>

      {mode === 'map' ? (
        <View style={s.flex}>
          <View style={s.mapHeading}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>
                {tab === 'Returning' ? 'WHERE YOUR FRIENDS GO BACK' : 'YOUR CITY, THROUGH PEOPLE'}
              </Text>
              <Text style={s.heading}>Find it on the map.</Text>
            </View>
            <View style={s.toggle}>
              <Pressable onPress={() => setMode('map')} style={[s.toggleItem, s.toggleOn]}>
                <Text style={s.toggleOnText}>Map</Text>
              </Pressable>
              <Pressable onPress={() => setMode('gallery')} style={s.toggleItem}>
                <Text style={s.toggleText}>Gallery</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
            {tags.map((t) => (
              <Chip key={t} label={t} active={tag === t} onPress={() => setTag(t)} />
            ))}
          </ScrollView>

          {Platform.OS === 'web' ? (
            <View style={s.webMapFallback}>
              <Text style={s.fallbackTitle}>Your Atlanta map</Text>
              <Text style={s.fallbackCopy}>
                Open this on iOS or Android for the interactive map. You can still browse the
                places below.
              </Text>
              <View style={s.mapFallbackGrid}>
                {visible.slice(0, 4).map((p) => (
                  <Pressable key={p.id} style={s.fallbackPlace} onPress={() => setSelectedId(p.id)}>
                    {cover(p) ? (
                      <Image source={{ uri: cover(p)! }} style={s.fallbackImage} contentFit="cover" />
                    ) : (
                      <View style={s.fallbackImage} />
                    )}
                    <Text style={s.cardTitle}>{p.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={s.mapContainer}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={DEMO_REGION}
                onRegionChangeComplete={setMapRegion}
                onLongPress={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  router.push({
                    pathname: '/new-entry',
                    params: { lat: String(latitude), lng: String(longitude) },
                  });
                }}>
                {visible.map((place) => {
                  const rank = rankById.get(place.id);
                  const isReturning = tab === 'Returning' && !!rank && rank.return_days > 0;
                  return (
                    <Marker
                      key={place.id}
                      coordinate={{ latitude: Number(place.lat), longitude: Number(place.lng) }}
                      onPress={() => setMapSelectedId(place.id)}
                      tracksViewChanges={false}>
                      <View
                        style={[
                          s.mapPin,
                          isReturning && s.mapPinReturning,
                          mapSelected?.id === place.id && s.mapPinSelected,
                        ]}>
                        <Text style={s.pinEmoji}>{pinFor(place)}</Text>
                      </View>
                    </Marker>
                  );
                })}
              </MapView>
              <Pressable style={s.recenter} onPress={() => setMapRegion(DEMO_REGION)}>
                <Text style={s.recenterText}>{'◎'}</Text>
              </Pressable>
            </View>
          )}

          {mapSelected ? (
            <Pressable style={s.mapPreview} onPress={() => setSelectedId(mapSelected.id)}>
              {cover(mapSelected) ? (
                <Image
                  source={{ uri: cover(mapSelected)! }}
                  style={s.mapPreviewImage}
                  contentFit="cover"
                />
              ) : (
                <View style={s.mapPreviewImage} />
              )}
              <View style={s.mapPreviewCopy}>
                <Text style={s.eyebrow}>
                  {rankById.get(mapSelected.id)?.return_days
                    ? `${rankById.get(mapSelected.id)!.return_days} RETURN DAYS`
                    : `${mapSelected.entries.length} ENTRIES`}{' '}
                  {'·'} ATLANTA
                </Text>
                <Text style={s.cardTitle}>{mapSelected.name}</Text>
                <Text numberOfLines={2} style={s.cardMeta}>
                  {newest(mapSelected)?.caption ?? 'No entry yet.'}
                </Text>
                <Text style={s.openLink}>OPEN STORY {'↗'}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
          {tab === 'Explore' ? (
            <>
              <Text style={s.eyebrow}>ATLANTA, GEORGIA {'·'} YOUR FRIENDS</Text>
              <Text style={s.heroTitle}>Get out there.</Text>
              <Text style={s.heroCopy}>
                Find places worth experiencing, through people worth listening to.
              </Text>
            </>
          ) : (
            <>
              <Text style={s.eyebrow}>NO LIKES, NO RATINGS</Text>
              <Text style={s.heroTitle}>They keep going back.</Text>
              <Text style={s.heroCopy}>
                Ranked only by return visits inside your friend group. The place someone went
                back to four times says more than five stars ever did.
              </Text>
            </>
          )}

          <View style={s.searchBox}>
            <Text style={s.searchIcon}>{'⌕'}</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Try &ldquo;coffee&rdquo; or &ldquo;Beltline&rdquo;"
              placeholderTextColor="#81786E"
              style={s.searchInput}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')}>
                <Text style={s.clearSearch}>{'×'}</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={s.primaryRow}>
            <ActionButton label={`Explore the map  ↗`} onPress={() => setMode('map')} />
            <Pressable style={s.outlineButton} onPress={createHere}>
              <Text style={s.outlineText}>{'＋'} Pin a place</Text>
            </Pressable>
          </View>

          {error ? <Banner text={error} /> : null}

          {tab === 'Returning' && returning.length > 0 ? (
            <View style={s.infoBox}>
              <Text style={s.sectionTitle}>
                #1 {returning[0].name} {'·'} {returning[0].return_days} return days
              </Text>
              <Text style={s.cardMeta}>
                {returning[0].repeat_friends} of {returning[0].friend_count} friends came back.
                {returning[0].who.length > 0 ? ` ${returning[0].who.join(', ')}.` : ''}
              </Text>
            </View>
          ) : null}

          <View style={s.sectionHeader}>
            <View>
              <Text style={s.eyebrow}>
                {tab === 'Returning' ? 'RANKED BY RETURN VISITS' : 'A GOOD PLACE TO START'}
              </Text>
              <Text style={s.sectionTitle}>
                {tab === 'Returning' ? 'Worth a second trip' : 'Through people around you'}
              </Text>
            </View>
            <Pressable onPress={() => setMode('map')}>
              <Text style={s.textLink}>Map {'↗'}</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
            {tags.map((t) => (
              <Chip key={t} label={t} active={tag === t} onPress={() => setTag(t)} />
            ))}
          </ScrollView>

          <View style={s.feedGrid}>
            {visible.map((place) => (
              <View key={place.id} style={{ width: cardWidth }}>
                <ExperienceCard
                  place={place}
                  rank={rankById.get(place.id)}
                  onPress={() => setSelectedId(place.id)}
                />
              </View>
            ))}
          </View>

          {loading && places.length === 0 ? (
            <View style={s.empty}>
              <ActivityIndicator color={C.cherry} />
              <Text style={s.cardMeta}>Loading the shared map…</Text>
            </View>
          ) : null}

          {!loading && visible.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>
                {places.length === 0 ? 'Nothing pinned here yet.' : 'Nothing matches that.'}
              </Text>
              <Text style={s.cardMeta}>
                {places.length === 0
                  ? 'Open your profile and join the demo map, or pin your first place.'
                  : 'Try another tag or clear the search.'}
              </Text>
              {places.length === 0 ? (
                <ActionButton label="Join the demo map" onPress={() => router.push('/share')} secondary />
              ) : (
                <ActionButton
                  label="Clear filters"
                  secondary
                  onPress={() => {
                    setTag('All');
                    setQuery('');
                  }}
                />
              )}
            </View>
          ) : null}
        </ScrollView>
      )}

      <View style={s.bottomNav}>
        <Pressable
          style={s.navItem}
          onPress={() => {
            setTab('Explore');
            setMode('gallery');
          }}>
          <Text style={[s.navIcon, tab === 'Explore' && s.navActive]}>{'⌂'}</Text>
          <Text style={[s.navLabel, tab === 'Explore' && s.navActive]}>Explore</Text>
        </Pressable>
        <Pressable
          style={s.navItem}
          onPress={() => {
            setTab('Returning');
            setMode('gallery');
          }}>
          <Text style={[s.navIcon, tab === 'Returning' && s.navActive]}>{'↻'}</Text>
          <Text style={[s.navLabel, tab === 'Returning' && s.navActive]}>Returning</Text>
        </Pressable>
        <Pressable style={s.createNav} onPress={createHere}>
          <Text style={s.plus}>{'＋'}</Text>
        </Pressable>
        <Pressable style={s.navItem} onPress={() => router.push('/share')}>
          <Text style={s.navIcon}>{'✉'}</Text>
          <Text style={s.navLabel}>Share</Text>
        </Pressable>
      </View>

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelectedId(null)}>
        <SafeAreaView style={s.modalSafe}>
          {selected ? (
            <ScrollView>
              <View style={s.detailTop}>
                <Pressable onPress={() => setSelectedId(null)} style={s.backButton}>
                  <Text style={s.backText}>{'←'}</Text>
                </Pressable>
                <Text style={s.eyebrow}>
                  {selected.entries.length > 1 ? 'A SHARED SCRAPBOOK' : 'A POSTCARD FROM SOMEONE'}
                </Text>
                <View style={{ width: 34 }} />
              </View>

              {cover(selected) ? (
                <Image source={{ uri: cover(selected)! }} style={s.detailImage} contentFit="cover" />
              ) : (
                <View style={s.detailImage} />
              )}

              <View style={s.detailBody}>
                <Text style={s.eyebrow}>
                  ATLANTA {'·'} {selected.entries.length}{' '}
                  {selected.entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
                </Text>
                <Text style={s.detailTitle}>{selected.name}</Text>

                {rankById.get(selected.id)?.return_days ? (
                  <View style={[s.infoBox, { marginTop: 16 }]}>
                    <Text style={s.cardMeta}>
                      {rankById.get(selected.id)!.who.join(', ')} kept coming back —{' '}
                      {rankById.get(selected.id)!.return_days} return days.
                    </Text>
                  </View>
                ) : null}

                {newest(selected)?.story ? (
                  <Text style={s.detailNote}>{'“'}{newest(selected)!.story}{'”'}</Text>
                ) : null}
                <Text style={s.detailCreator}>
                  A note from {newest(selected)?.user_name ?? selected.created_by_name ?? 'a friend'}
                </Text>

                <View style={s.entryStrip}>
                  <Text style={s.sectionTitle}>
                    {selected.entries.length} {selected.entries.length === 1 ? 'entry' : 'entries'}
                  </Text>
                  <Text style={s.cardMeta}>Everything your friends have left here.</Text>
                  {selected.entries.map((entry) => (
                    <View key={entry.id} style={s.stopRow}>
                      {entry.photo_urls[0] ? (
                        <Image
                          source={{ uri: entry.photo_urls[0] }}
                          style={s.stopImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={s.stopImage} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardTitle}>{entry.caption ?? 'Untitled'}</Text>
                        <Text style={s.cardMeta}>
                          {entry.user_name ?? 'A friend'} {'·'} {when(entry.created_at)}
                        </Text>
                        {entry.tags.length > 0 ? (
                          <Text style={s.cardCreator}>{entry.tags.join(' · ')}</Text>
                        ) : null}
                      </View>
                      {entry.postcard_text ? (
                        <Pressable
                          style={s.smallCircle}
                          onPress={() => {
                            setSelectedId(null);
                            router.push({
                              pathname: '/postcard',
                              params: { entry_id: entry.id },
                            });
                          }}>
                          <Text>{'✉'}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>

                <ActionButton
                  label={`Add your entry here  ↗`}
                  onPress={() => {
                    setSelectedId(null);
                    router.push({
                      pathname: '/new-entry',
                      params: {
                        place_id: selected.id,
                        name: selected.name,
                        lat: String(selected.lat),
                        lng: String(selected.lng),
                      },
                    });
                  }}
                />
                <View style={{ height: 36 }} />
              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={profileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileOpen(false)}>
        <Pressable style={s.profileOverlay} onPress={() => setProfileOpen(false)}>
          <Pressable style={s.profileCard} onPress={() => {}}>
            <View style={s.profileAvatar}>
              <Text style={s.profileAvatarText}>{initial}</Text>
            </View>
            <Text style={s.detailTitle}>Your corner.</Text>
            <Text style={s.cardMeta}>
              {profile.name ?? profile.email ?? 'Signed in'} {'·'}{' '}
              {places.filter((p) => p.created_by === profile.sub).length} places pinned by you
            </Text>
            <ActionButton
              label="Share this map / join a friend"
              secondary
              onPress={() => {
                setProfileOpen(false);
                router.push('/share');
              }}
            />
            <ActionButton
              label="Sign out"
              onPress={() => {
                setProfileOpen(false);
                signOut();
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
