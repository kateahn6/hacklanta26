import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Banner, Chip } from '@/components/ui';
import { s } from '@/constants/styles';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { toDataUrls } from '@/lib/photos';
import type { ScrapbookPage } from '@/lib/types';

export default function NewEntryScreen() {
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    place_id?: string;
    name?: string;
  }>();
  const { profile, getAccessToken } = useAuth();
  const { refresh } = useData();

  const [placeName, setPlaceName] = useState(params.name ?? '');
  const [photos, setPhotos] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [story, setStory] = useState('');
  const [tags, setTags] = useState('');
  const [postcard, setPostcard] = useState('');
  const [placeType, setPlaceType] = useState('');
  const [source, setSource] = useState<ScrapbookPage['source'] | null>(null);
  const [status, setStatus] = useState<'idle' | 'picking' | 'analyzing' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);

  const lat = Number(params.lat);
  const lng = Number(params.lng);
  const hasPin = Number.isFinite(lat) && Number.isFinite(lng);

  const pickPhotos = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo library access to build a scrapbook page.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.8,
    });
    if (result.canceled) return;
    setStatus('picking');
    try {
      // Resized to ~1024px and base64-encoded before anything leaves the phone.
      setPhotos(await toDataUrls(result.assets.map((a) => a.uri)));
    } catch (err: any) {
      setError(err?.message ?? 'Could not prepare those photos');
    } finally {
      setStatus('idle');
    }
  };

  const generate = async () => {
    if (photos.length === 0) {
      setError('Pick at least one photo first.');
      return;
    }
    setStatus('analyzing');
    setError(null);
    try {
      const token = await getAccessToken();
      const page = await api<ScrapbookPage>('/api/analyze', {
        method: 'POST',
        token,
        profile,
        body: { photos, hint: placeName || undefined },
        timeoutMs: 40_000,
      });
      setPlaceType(page.place_type);
      setCaption(page.caption);
      setStory(page.story);
      setTags(page.tags.join(', '));
      setPostcard(page.postcard_text);
      setSource(page.source ?? null);
      if (!placeName && page.place_type) setPlaceName(page.place_type);
    } catch (err: any) {
      setError(err?.message ?? 'Gemini could not read those photos');
    } finally {
      setStatus('idle');
    }
  };

  const save = async () => {
    if (!params.place_id && !placeName.trim()) {
      setError('Give the place a name.');
      return;
    }
    if (!params.place_id && !hasPin) {
      setError('No pin location — drop a pin on the map first.');
      return;
    }
    setStatus('saving');
    setError(null);
    try {
      const token = await getAccessToken();
      await api('/api/entries', {
        method: 'POST',
        token,
        profile,
        body: {
          place_id: params.place_id,
          place: params.place_id ? undefined : { name: placeName.trim(), lat, lng },
          caption: caption.trim() || null,
          story: story.trim() || null,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          postcard_text: postcard.trim() || null,
          photo_urls: photos,
        },
      });
      await refresh();
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save the entry');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <SafeAreaView style={s.modalSafe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.detailTop}>
          <Pressable onPress={() => router.back()} style={s.backButton}>
            <Text style={s.backText}>{'←'}</Text>
          </Pressable>
          <Text style={s.eyebrow}>MAKE SOMETHING PERSONAL</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={s.createPage} keyboardShouldPersistTaps="handled">
          <Text style={s.detailTitle}>A little note from here.</Text>
          <Text style={s.heroCopy}>
            One place, a few photos, and the reason to go. Gemini writes the first draft.
          </Text>

          {error ? <Banner text={error} /> : null}

          <Pressable onPress={pickPhotos} style={s.photoPicker}>
            {photos.length > 0 ? (
              <Image source={{ uri: photos[0] }} style={s.pickedPhoto} contentFit="cover" />
            ) : (
              <>
                <Text style={s.photoPlus}>{'＋'}</Text>
                <Text style={s.sectionTitle}>Add photos</Text>
                <Text style={s.cardMeta}>Up to four. Make it yours.</Text>
              </>
            )}
          </Pressable>

          {photos.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoStrip}>
              {photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={s.thumb} contentFit="cover" />
              ))}
            </ScrollView>
          ) : null}

          <View style={s.optionRow}>
            <ActionButton
              secondary
              label={photos.length ? `Change (${photos.length})` : 'Pick photos'}
              busy={status === 'picking'}
              onPress={pickPhotos}
            />
            <ActionButton
              label="Let Gemini write it"
              busy={status === 'analyzing'}
              disabled={photos.length === 0}
              onPress={generate}
            />
          </View>

          {source === 'demo' ? (
            <Banner tone="info" text="Gemini was unavailable — this is the demo fallback page." />
          ) : null}
          {source === 'gemini' && placeType ? (
            <Banner tone="info" text={`Gemini read these as: ${placeType}`} />
          ) : null}

          <Text style={s.formLabel}>PLACE NAME</Text>
          <TextInput
            style={s.formInput}
            value={placeName}
            onChangeText={setPlaceName}
            editable={!params.place_id}
            placeholder="e.g. Hodgepodge Coffee"
            placeholderTextColor="#81786E"
          />
          <Text style={s.smallNote}>
            {params.place_id
              ? 'Adding to an existing pin'
              : hasPin
                ? `New pin at ${lat.toFixed(5)}, ${lng.toFixed(5)}`
                : 'No pin location'}
          </Text>

          <Text style={s.formLabel}>CAPTION</Text>
          <TextInput
            style={s.formInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="One line about this place"
            placeholderTextColor="#81786E"
          />

          <Text style={s.formLabel}>THE STORY</Text>
          <TextInput
            style={[s.formInput, s.multiline]}
            value={story}
            onChangeText={setStory}
            multiline
            placeholder="What happened here"
            placeholderTextColor="#81786E"
          />

          <Text style={s.formLabel}>TAGS</Text>
          <TextInput
            style={s.formInput}
            value={tags}
            onChangeText={setTags}
            placeholder="coffee, slow morning"
            placeholderTextColor="#81786E"
          />
          {tags.trim() ? (
            <View style={[s.optionRow, { marginTop: 8 }]}>
              {tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .slice(0, 6)
                .map((t) => (
                  <Chip key={t} label={t} active onPress={() => {}} />
                ))}
            </View>
          ) : null}

          <Text style={s.formLabel}>POSTCARD MESSAGE</Text>
          <TextInput
            style={[s.formInput, s.multiline]}
            value={postcard}
            onChangeText={setPostcard}
            multiline
            placeholder="What you would write on the back"
            placeholderTextColor="#81786E"
          />

          <View style={{ height: 20 }} />
          <ActionButton
            label="Save to the shared map"
            busy={status === 'saving'}
            onPress={save}
          />
          <Text style={s.smallNote}>
            Saving also records a visit — that is what the Returning tab ranks.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
