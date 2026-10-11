import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { FormField, TextBox } from '@/components/create/form-field';
import { FormFooter } from '@/components/create/form-footer';
import { PreviewModal } from '@/components/create/preview-modal';
import { PhotoPickerField } from '@/components/create/photo-picker-field';
import { PostcardView } from '@/components/postcard/postcard-view';
import { AppText } from '@/components/ui/app-text';
import { BusyOverlay } from '@/components/ui/busy-overlay';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Notice } from '@/components/ui/notice';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopBar } from '@/components/ui/top-bar';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { CATEGORIES } from '@/data/categories';
import { currentUserId } from '@/lib/me';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { newId } from '@/lib/format';
import { toDataUrl } from '@/lib/photos';
import type { ScrapbookPage } from '@/lib/types';
import { isOwn } from '@/lib/visibility';
import { useAppStore } from '@/store/app-store';
import { useContent } from '@/store/content';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';
import type { CategoryId, ExpiryOption, Photo, Place, Postcard, PublishStatus, Visibility } from '@/types';

const NOTE_LIMIT = 200;
/** Used when a new place has no picked coordinate: the demo city's centre. */
const ATLANTA = { latitude: 33.765, longitude: -84.377 };
const HOUR = 60 * 60 * 1000;
const EXPIRY_MS: Record<ExpiryOption, number | null> = { never: null, '24h': 24 * HOUR, '7d': 7 * 24 * HOUR };

type Errors = Partial<Record<'photo' | 'place' | 'city' | 'note' | 'form', string>>;

export function CreatePostcardScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    /** Set when the map sent us here with a dropped pin. */
    lat?: string;
    lng?: string;
  }>();
  const content = useContent();
  const { profile, getAccessToken } = useAuth();
  const { refresh } = useData();
  const upsertPlace = useAppStore((s) => s.upsertPlace);
  const upsertPostcard = useAppStore((s) => s.upsertPostcard);

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
  const [tags, setTags] = useState<string[]>([]);
  const [postcardText, setPostcardText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [polishedNothing, setPolishedNothing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiSource, setAiSource] = useState<ScrapbookPage['source'] | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const author = content.userById.get(currentUserId());

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

  /** Photo in, scrapbook page out. The backend falls back to a canned page. */
  const generate = async () => {
    if (!photo || typeof photo.source === 'number') {
      setErrors({ photo: 'Add a photo first so Gemini has something to read.' });
      return;
    }
    setGenerating(true);
    setErrors({});
    try {
      const token = await getAccessToken();
      // Resized to ~1024px before it leaves the phone.
      const dataUrl = await toDataUrl(photo.source.uri);
      const page = await api<ScrapbookPage>('/api/analyze', {
        method: 'POST',
        token,
        profile,
        body: { photos: [dataUrl], hint: placeName || undefined },
        timeoutMs: 40_000,
      });
      setNote(page.story.slice(0, NOTE_LIMIT));
      setTags(page.tags);
      setPostcardText(page.postcard_text);
      setAiSource(page.source ?? null);
      if (!placeName.trim()) setPlaceName(page.place_type);
      if (!category) {
        const guess = CATEGORIES.find((c) =>
          page.tags.some((t) => c.id === 'food' ? /coffee|food|bar|market/.test(t) : t.includes(c.id))
        );
        if (guess) setCategory(guess.id);
      }
    } catch (err: any) {
      setErrors({ form: err?.message ?? 'Gemini could not read that photo.' });
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Tidies up what the user already wrote, for when the photo says little or
   * they would rather write it themselves. Only non-empty fields are applied:
   * the server's fallback echoes the original note back with the rest blank,
   * and blanking someone's work would be worse than doing nothing.
   */
  const polish = async () => {
    if (!note.trim()) {
      setErrors({ note: 'Write a few words first and Gemini will tidy them up.' });
      return;
    }
    setPolishing(true);
    setErrors({});
    setPolishedNothing(false);
    try {
      const token = await getAccessToken();
      const page = await api<ScrapbookPage>('/api/polish', {
        method: 'POST',
        token,
        profile,
        body: { text: note.trim(), hint: placeName || undefined },
        timeoutMs: 40_000,
      });
      if (page.story) setNote(page.story.slice(0, NOTE_LIMIT));
      if (page.tags?.length) setTags(page.tags);
      if (page.postcard_text) setPostcardText(page.postcard_text);
      if (page.place_type && !placeName.trim()) setPlaceName(page.place_type);
      setAiSource(page.source ?? null);
      // The fallback echoes the text back, so say so rather than looking inert.
      setPolishedNothing(page.source === 'demo');
    } catch (err: any) {
      setErrors({ form: err?.message ?? 'Gemini could not rewrite that.' });
    } finally {
      setPolishing(false);
    }
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

  const openPreview = () => {
    const found = validate('published');
    setErrors(found);
    if (Object.keys(found).length === 0) setPreviewing(true);
  };

  // What the place will look like once saved, for the preview.
  const previewPlace: Place = linkedPlace ?? {
    id: 'preview',
    name: placeName.trim(),
    neighborhood: '',
    city: city.trim(),
    categories: category ? [category] : [],
    coordinate: null,
  };

  const save = async (status: PublishStatus) => {
    const found = validate(status);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setPreviewing(false);

    // A published postcard goes to the shared map. Drafts and scrapbook stops
    // stay on the device, which is what the local store is for.
    if (status === 'published' && !editing) {
      setSaving(true);
      setErrors({});
      try {
        const token = await getAccessToken();
        const photoUrls =
          photo && typeof photo.source !== 'number' ? [await toDataUrl(photo.source.uri)] : [];
        const lat = Number(params.lat ?? linkedPlace?.coordinate?.latitude ?? ATLANTA.latitude);
        const lng = Number(params.lng ?? linkedPlace?.coordinate?.longitude ?? ATLANTA.longitude);
        const saved = await api<{ entry: { id: string } }>('/api/entries', {
          method: 'POST',
          token,
          profile,
          body: {
            place_id: linkedPlace?.id,
            place: linkedPlace?.id ? undefined : { name: placeName.trim(), lat, lng },
            caption: placeName.trim() || null,
            story: note.trim() || null,
            tags,
            postcard_text: postcardText || note.trim() || null,
            photo_urls: photoUrls,
          },
        });
        await refresh();
        router.replace({
          pathname: '/postcard/[id]',
          params: { id: saved.entry.id, justPublished: '1' },
        });
        return;
      } catch (err: any) {
        setErrors({ form: err?.message ?? 'Could not save to the shared map.' });
        return;
      } finally {
        setSaving(false);
      }
    }

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
      authorId: currentUserId(),
      photo,
      note: note.trim(),
      visibility,
      status,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      expiresAt: status === 'published' && expiryMs ? new Date(Date.now() + expiryMs).toISOString() : null,
      expiryOption: expiry,
    };
    upsertPostcard(postcard);

    router.replace({ pathname: '/postcard/[id]', params: { id: postcard.id, justPublished: '1' } });
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title={editing ? 'Edit postcard' : 'New postcard'} backIcon="close" />

      {generating ? (
        <BusyOverlay
          title="Reading your photo…"
          patienceNote="Gemini is writing the page. This can take up to 20 seconds."
        />
      ) : null}
      {polishing ? (
        <BusyOverlay
          title="Tidying your words…"
          patienceNote="Keeping your meaning, fixing the rest. This can take up to 20 seconds."
        />
      ) : null}
      {saving ? <BusyOverlay title="Saving to the shared map…" /> : null}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField label="Photo" error={errors.photo}>
          <PhotoPickerField photo={photo} onChange={setPhoto} invalid={Boolean(errors.photo)} />
        </FormField>

        <View style={styles.aiRow}>
          <Button
            label="Write from photo"
            icon="sparkles-outline"
            variant="secondary"
            onPress={generate}
            loading={generating}
            disabled={!photo || polishing}
            flex
          />
          <Button
            label="Tidy my words"
            icon="create-outline"
            variant="secondary"
            onPress={polish}
            loading={polishing}
            disabled={!note.trim() || generating}
            flex
          />
        </View>
        {aiSource === 'demo' ? (
          <Notice
            icon="cloud-offline-outline"
            tone="slate"
            message="Gemini was unavailable, so this is the demo fallback page. Edit it freely."
          />
        ) : null}
        {aiSource === 'gemini' ? (
          <Notice
            icon="sparkles"
            message="Gemini drafted the note and tags from your photo. Edit anything before publishing."
          />
        ) : null}
        {polishedNothing ? (
          <Notice
            icon="time-outline"
            tone="slate"
            message="Gemini took too long, so your words were left exactly as you wrote them. Try again, or just publish as is."
          />
        ) : null}
        {errors.form ? <Notice icon="warning-outline" tone="navy" message={errors.form} /> : null}

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
              <Ionicons name="location" size={14} color={Colors.slate} />
              <AppText variant="caption" color={Colors.navy}>
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
              <Ionicons name="location-outline" size={16} color={Colors.navy} />
              <View style={styles.flex}>
                <AppText variant="label">{place.name}</AppText>
                <AppText variant="caption">{place.neighborhood}</AppText>
              </View>
              <AppText variant="caption" color={Colors.navy}>
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

        {errors.form ? <Notice icon="alert-circle-outline" tone="navy" message={errors.form} /> : null}
        {Object.keys(errors).length > 0 && !errors.form ? (
          <Notice icon="alert-circle-outline" tone="navy" message="A few things need attention before publishing." />
        ) : null}
      </ScrollView>
      <FormFooter
        onSaveDraft={() => save('draft')}
        onPublish={openPreview}
        publishing={saving}
        publishLabel="Preview"
      />

      {author ? (
        <PreviewModal
          visible={previewing}
          visibility={visibility}
          postLabel={editing?.status === 'published' ? 'Update' : 'Post'}
          onEdit={() => setPreviewing(false)}
          onPost={() => save('published')}>
          <PostcardView
            photo={photo}
            note={note.trim()}
            place={previewPlace}
            author={author}
            date={editing?.visitedOn ?? new Date().toISOString()}
            isOwn
          />
        </PreviewModal>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: Gutter, paddingBottom: Spacing.xxl, gap: Spacing.xl },
  aiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  linked: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
