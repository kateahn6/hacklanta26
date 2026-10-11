import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapMarker } from '@/components/map/map-marker';
import { PlaceGallery } from '@/components/map/place-gallery';
import { PlacePreviewCard } from '@/components/map/place-preview-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { CategoryChips } from '@/components/ui/category-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SearchBar } from '@/components/ui/search-bar';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { CITY_REGION } from '@/data/content-source';
import { useNow } from '@/hooks/use-now';
import { buildMapPlaces, filterMapPlaces, type MapPlace } from '@/lib/map-places';
import { notedMapStyle } from '@/lib/map-style';
import { useContent } from '@/store/content';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';
import type { CategoryId, Coordinate } from '@/types';

type View_ = 'map' | 'gallery';

const MAP_LOAD_TIMEOUT_MS = 12_000;
const CARD_GAP = Spacing.md;
const PLACE_DELTA = 0.018;

export function MapScreen() {
  const params = useLocalSearchParams<{ placeId?: string; scrapbookId?: string; view?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const content = useContent();
  const now = useNow();
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList<MapPlace>>(null);

  const [mode, setMode] = useState<View_>(params.view === 'gallery' ? 'gallery' : 'map');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [scrapbookId, setScrapbookId] = useState<string | undefined>(params.scrapbookId);
  const [selectedId, setSelectedId] = useState<string | null>(params.placeId ?? null);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);

  const scrapbook = scrapbookId ? content.scrapbookById.get(scrapbookId) : undefined;
  const allPlaces = buildMapPlaces(
    content,
    now,
    scrapbook ? new Set(scrapbook.stops.map((s) => s.postcardId)) : undefined,
  );
  const places = filterMapPlaces(allPlaces, category, query);
  const selectedIndex = places.findIndex((p) => p.place.id === selectedId);
  const cardWidth = width - Gutter * 2 - 28;

  // A map that never reports ready (no tiles, missing config) gets an honest error state.
  useEffect(() => {
    if (mode !== 'map' || mapReady) return;
    const timer = setTimeout(() => setMapFailed(true), MAP_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [mode, mapReady, mapAttempt]);

  const focusOn = (coordinate: Coordinate) => {
    mapRef.current?.animateToRegion(
      { ...coordinate, latitude: coordinate.latitude - PLACE_DELTA * 0.18, latitudeDelta: PLACE_DELTA, longitudeDelta: PLACE_DELTA },
      450,
    );
  };

  const selectPlace = (mapPlace: MapPlace, scrollList: boolean) => {
    setSelectedId(mapPlace.place.id);
    focusOn(mapPlace.coordinate);
    const index = places.indexOf(mapPlace);
    if (scrollList && index >= 0) listRef.current?.scrollToOffset({ offset: index * (cardWidth + CARD_GAP), animated: true });
  };

  const onMapReady = () => {
    setMapReady(true);
    const initial = places.find((p) => p.place.id === selectedId);
    if (initial) {
      focusOn(initial.coordinate);
      const index = places.indexOf(initial);
      setTimeout(() => listRef.current?.scrollToOffset({ offset: index * (cardWidth + CARD_GAP), animated: false }), 50);
    } else if (scrapbook && places.length > 0) {
      mapRef.current?.fitToCoordinates(
        places.map((p) => p.coordinate),
        { edgePadding: { top: 240, right: 60, bottom: 260, left: 60 }, animated: true },
      );
    }
  };

  const recenter = () => {
    setSelectedId(null);
    mapRef.current?.animateToRegion(CITY_REGION, 450);
  };

  // The map remounts when returning from the gallery; onMapReady then focuses the selection.
  const changeMode = (next: View_) => {
    if (next === 'map' && mode !== 'map') {
      setMapReady(false);
      setMapFailed(false);
    }
    setMode(next);
  };

  const showOnMap = (placeId: string) => {
    setSelectedId(placeId);
    changeMode('map');
  };

  const retryMap = () => {
    setMapFailed(false);
    setMapReady(false);
    setMapAttempt((n) => n + 1);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory(null);
  };

  const noResults = (
    <EmptyState
      icon="location-outline"
      title="No places match"
      message="Try a different search or category."
      actionLabel="Clear filters"
      onAction={clearFilters}
    />
  );

  const header = (
    <View
      style={[styles.header, { paddingTop: insets.top + Spacing.sm }, mode === 'gallery' && styles.headerSolid]}
      pointerEvents="box-none">
      <View style={styles.searchRow} pointerEvents="box-none">
        <IconButton icon="arrow-back" label="Back to Explore" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <View style={styles.flex}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search places or categories" compact />
        </View>
      </View>
      <View style={styles.toggleRow} pointerEvents="box-none">
        <View style={styles.toggle}>
          <SegmentedControl<View_>
            value={mode}
            onChange={changeMode}
            floating
            options={[
              { value: 'map', label: 'Map' },
              { value: 'gallery', label: 'Gallery' },
            ]}
          />
        </View>
        {scrapbook ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Showing places from ${scrapbook.title}. Show all places`}
            onPress={() => setScrapbookId(undefined)}
            style={styles.scope}>
            <Ionicons name="albums-outline" size={14} color={Colors.cream} />
            <AppText variant="caption" color={Colors.cream} numberOfLines={1} style={styles.flexShrink}>
              {scrapbook.title}
            </AppText>
            <Ionicons name="close" size={14} color={Colors.cream} />
          </PressableScale>
        ) : null}
      </View>
      <View style={styles.chips}>
        <CategoryChips value={category} onChange={setCategory} floating />
      </View>
    </View>
  );

  if (mode === 'gallery') {
    return (
      <View style={styles.screen}>
        {header}
        <PlaceGallery places={places} onShowOnMap={showOnMap} empty={noResults} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <MapView
        key={mapAttempt}
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={CITY_REGION}
        onMapReady={onMapReady}
        customMapStyle={Platform.OS === 'android' ? notedMapStyle : undefined}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        userInterfaceStyle="light"
        showsPointsOfInterests={false}
        showsCompass={false}
        toolbarEnabled={false}
        onPress={(event) => {
          if (event.nativeEvent.action !== 'marker-press') setSelectedId(null);
        }}>
        {places.map((mapPlace, index) => (
          <Marker
            key={mapPlace.place.id}
            identifier={mapPlace.place.id}
            coordinate={mapPlace.coordinate}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={mapPlace.place.id === selectedId ? 10 : 1}
            accessibilityLabel={`${mapPlace.place.name}, ${mapPlace.postcards.length} postcards`}
            onPress={(event) => {
              event.stopPropagation();
              selectPlace(mapPlace, true);
            }}>
            <MapMarker mapPlace={mapPlace} selected={mapPlace.place.id === selectedId} tilt={index % 2 === 0 ? -4 : 3} />
          </Marker>
        ))}
      </MapView>

      {header}

      {mapFailed && !mapReady ? (
        <View style={styles.errorWrap} pointerEvents="box-none">
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={26} color={Colors.cherry} />
            <AppText variant="subheading">The map didn’t load</AppText>
            <AppText variant="caption" style={styles.center}>
              Map tiles couldn’t be reached. Check your connection, or browse the same places as a gallery.
            </AppText>
            <View style={styles.errorActions}>
              <Button label="Try again" variant="secondary" onPress={retryMap} flex />
              <Button label="Show gallery" onPress={() => changeMode('gallery')} flex />
            </View>
          </View>
        </View>
      ) : null}

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.md }]} pointerEvents="box-none">
        <View style={styles.recenterRow} pointerEvents="box-none">
          <IconButton icon="locate-outline" label="Recenter map on Atlanta" onPress={recenter} />
        </View>
        {places.length === 0 ? (
          <View style={styles.noResults}>
            <AppText variant="label">No places match these filters.</AppText>
            <Button label="Clear" variant="ghost" onPress={clearFilters} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={places}
            horizontal
            keyExtractor={(item) => item.place.id}
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.cards}
            keyboardShouldPersistTaps="handled"
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + CARD_GAP));
              const target = places[Math.min(Math.max(index, 0), places.length - 1)];
              if (target && target.place.id !== selectedId) selectPlace(target, false);
            }}
            renderItem={({ item, index }) => (
              <PlacePreviewCard mapPlace={item} width={cardWidth} selected={index === selectedIndex} />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, gap: Spacing.sm, zIndex: 5 },
  headerSolid: { position: 'relative', backgroundColor: Colors.cream, paddingBottom: Spacing.md },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Gutter },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Gutter },
  toggle: { width: 180 },
  scope: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Colors.blackOlive,
  },
  chips: { marginHorizontal: 0 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: Spacing.md },
  recenterRow: { alignItems: 'flex-end', paddingHorizontal: Gutter },
  cards: { gap: CARD_GAP, paddingHorizontal: Gutter },
  noResults: {
    marginHorizontal: Gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.paper,
  },
  errorWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: Gutter },
  errorCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.paper,
    boxShadow: '0 4px 16px rgba(33, 31, 28, 0.16)',
  },
  errorActions: { flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch', marginTop: Spacing.sm },
});
