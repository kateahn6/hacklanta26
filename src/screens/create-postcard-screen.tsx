import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { FormField, TextBox } from '@/components/create/form-field';
import { FormFooter } from '@/components/create/form-footer';
import { PhotoPickerField } from '@/components/create/photo-picker-field';
import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { Notice } from '@/components/ui/notice';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopBar } from '@/components/ui/top-bar';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { CATEGORIES } from '@/data/categories';
import { DEMO_USER_ID } from '@/data/content-source';
import { newId } from '@/lib/format';
import { isOwn } from '@/lib/visibility';
import { useAppStore } from '@/store/app-store';
import { useContent } from '@/store/content';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';
import type { CategoryId, ExpiryOption, Photo, Postcard, PublishStatus, Visibility } from '@/types';

const NOTE_LIMIT = 200;
const HOUR = 60 * 60 * 1000;
const EXPIRY_MS: Record<ExpiryOption, number | null> = { never: null, '24h': 24 * HOUR, '7d': 7 * 24 * HOUR };

type Errors = Partial<Record<'photo' | 'place' | 'city' | 'note' | 'form', string>>;

export function CreatePostcardScreen() {
  const params = useLocalSearchParams<{ id?: string; forScrapbook?: string }>();
  const content = useContent();
  const upsertPlace = useAppStore((s) => s.upsertPlace);
  const upsertPostcard = useAppStore((s) => s.upsertPostcard);
  const addComposerStops = useAppStore((s) => s.addComposerStops);

  const existing = params.id ? content.postcardById.get(params.id) : undefined;
  const editing = existing && isOwn(existing) ? existing : undefined;
  const existingPlace = editing ? content.placeById.get(editing.placeId) : undefined;

  const [photo, setPhoto] = useState<Photo | null>(editing?.photo ?? null);
  const [placeName, setPlaceName] = useState(existingPlace?.name ?? '');
  const [linkedPlaceId, setLinkedPlaceId] = useState<string | null>(existingPlace?.id ?? null);
  const [city, setCity] = useState(existingPlace?.city ?? 'Atlanta');
  const [note, setNote] = useState(editing?.note ?? '');
  const [category, setCategory] = useState<CategoryId | null>(existingPlace?.categories[0] ?? null);
  const [visibility, setVisibility] = useState<Visibility>(editing?.visibility ?? 'public');
  const [expiry, setExpiry] = useState<ExpiryOption>(editing?.expiryOption ?? 'never');
  const [errors, setErrors] = useState<Errors>({});

  const linkedPlace = linkedPlaceId ? content.placeById.get(linkedPlaceId) : undefined;
  const q = placeName.trim().toLowerCase();
  const suggestions =
    !linkedPlace && q.length >= 2
      ? content.places.filter((p) => p.coordinate && p.name.toLowerCase().includes(q)).slice(0, 4)
      : [];

  const editPlaceName = (text: string) => {
    setPlaceName(text);
    if (linkedPlace && text !== linkedPlace.name) setLinkedPlaceId(null);
  };

  const linkPlace = (placeId: string) => {
    const place = content.placeById.get(placeId);
    if (!place) return;
    setLinkedPlaceId(place.id);
    setPlaceName(place.name);
    setCity(place.city);
    setCategory(place.categories[0] ?? null);
  };

  const validate = (status: PublishStatus): Errors => {
    if (status === 'draft') {
      return photo || placeName.trim() || note.trim() ? {} : { form: 'Add a photo, place, or note before saving a draft.' };
    }
    const next: Errors = {};
    if (!photo) next.photo = 'Add a photo so people can see the place.';
    if (!placeName.trim()) next.place = 'Name the place.';
    if (!city.trim()) next.city = 'Add the city.';
    if (!note.trim()) next.note = 'Write a short note about why you liked it.';
    return next;
  };

  const save = (status: PublishStatus) => {
    const found = validate(status);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    let placeId = linkedPlace?.id;
    if (!placeId) {
      placeId = newId('place');
      upsertPlace({
        id: placeId,
        name: placeName.trim() || 'Untitled place',
        neighborhood: '',
        city: city.trim() || 'Atlanta',
        categories: category ? [category] : [],
        coordinate: null,
      });
    }

    const expiryMs = EXPIRY_MS[expiry];
    const postcard: Postcard = {
      id: editing?.id ?? newId('pc'),
      placeId,
      authorId: DEMO_USER_ID,
      photo,
      note: note.trim(),
      visibility,
      status,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      expiresAt: status === 'published' && expiryMs ? new Date(Date.now() + expiryMs).toISOString() : null,
      expiryOption: expiry,
    };
    upsertPostcard(postcard);

    if (params.forScrapbook) {
      addComposerStops([postcard.id]);
      router.back();
    } else {
      router.replace({ pathname: '/postcard/[id]', params: { id: postcard.id, justPublished: '1' } });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title={editing ? 'Edit postcard' : 'New postcard'} backIcon="close" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {params.forScrapbook ? (
          <Notice icon="albums-outline" message="This postcard will be added to the scrapbook you’re making." />
        ) : null}

        <FormField label="Photo" error={errors.photo}>
          <PhotoPickerField photo={photo} onChange={setPhoto} invalid={Boolean(errors.photo)} />
        </FormField>

        <FormField
          label="Place"
          error={errors.place}
          hint={linkedPlace?.coordinate ? undefined : 'Pick a suggestion to pin it on the map.'}>
          <TextBox
            value={placeName}
            onChangeText={editPlaceName}
            placeholder="e.g. Krog Street Tunnel"
            accessibilityLabel="Place name"
            invalid={Boolean(errors.place)}
          />
          {linkedPlace?.coordinate ? (
            <View style={styles.linked}>
              <Ionicons name="location" size={14} color={Colors.olive} />
              <AppText variant="caption" color={Colors.blackOlive}>
                {linkedPlace.neighborhood}, {linkedPlace.city} · pinned on the map
              </AppText>
            </View>
          ) : null}
          {suggestions.map((place) => (
            <PressableScale
              key={place.id}
              accessibilityRole="button"
              accessibilityLabel={`Use ${place.name}, ${place.neighborhood}`}
              onPress={() => linkPlace(place.id)}
              style={styles.suggestion}>
              <Ionicons name="location-outline" size={16} color={Colors.cherry} />
              <View style={styles.flex}>
                <AppText variant="label">{place.name}</AppText>
                <AppText variant="caption">{place.neighborhood}</AppText>
              </View>
              <AppText variant="caption" color={Colors.cherry}>
                Use
              </AppText>
            </PressableScale>
          ))}
        </FormField>

        <FormField label="City" error={errors.city}>
          <TextBox value={city} onChangeText={setCity} placeholder="City" accessibilityLabel="City" invalid={Boolean(errors.city)} />
        </FormField>

        <FormField label="Your note" error={errors.note} hint={`${note.length}/${NOTE_LIMIT} · Keep it personal: why did you love it?`}>
          <TextBox
            value={note}
            onChangeText={setNote}
            placeholder="Walked in for coffee and stayed for two hours…"
            accessibilityLabel="Your note"
            multiline
            maxLength={NOTE_LIMIT}
            invalid={Boolean(errors.note)}
          />
        </FormField>

        <FormField label="Category" optional>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                icon={c.icon}
                selected={category === c.id}
                onPress={() => setCategory(category === c.id ? null : c.id)}
              />
            ))}
          </View>
        </FormField>

        <FormField label="Who can see it">
          <VisibilitySelector value={visibility} onChange={setVisibility} />
        </FormField>

        <FormField label="Expires" optional hint="Great for pop-ups and limited-time finds. It leaves public discovery when it expires.">
          <SegmentedControl<ExpiryOption>
            value={expiry}
            onChange={setExpiry}
            options={[
              { value: 'never', label: 'Never' },
              { value: '24h', label: '24 hours' },
              { value: '7d', label: '7 days' },
            ]}
          />
        </FormField>

        {errors.form ? <Notice icon="alert-circle-outline" tone="cherry" message={errors.form} /> : null}
        {Object.keys(errors).length > 0 && !errors.form ? (
          <Notice icon="alert-circle-outline" tone="cherry" message="A few things need attention before publishing." />
        ) : null}
      </ScrollView>
      <FormFooter
        onSaveDraft={() => save('draft')}
        onPublish={() => save('published')}
        publishLabel={editing?.status === 'published' ? 'Update' : 'Publish'}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  content: { paddingHorizontal: Gutter, paddingBottom: Spacing.xxl, gap: Spacing.xl },
  linked: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.paper,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
