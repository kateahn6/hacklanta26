import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Banner, Button, Label } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
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
      setError('Photo access is needed to build a scrapbook page.');
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
      // Resized to ~1024px and turned into base64 data URLs before anything
      // leaves the phone.
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
          place: params.place_id
            ? undefined
            : { name: placeName.trim(), lat, lng },
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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {error ? <Banner text={error} /> : null}

        <View style={styles.block}>
          <Label>Place</Label>
          <TextInput
            style={styles.input}
            value={placeName}
            onChangeText={setPlaceName}
            editable={!params.place_id}
            placeholder="What is this place called?"
            placeholderTextColor={Colors.inkSoft}
          />
          <Text style={styles.coords}>
            {params.place_id
              ? 'Adding to an existing pin'
              : hasPin
                ? `New pin at ${lat.toFixed(5)}, ${lng.toFixed(5)}`
                : 'No pin location'}
          </Text>
        </View>

        <View style={styles.block}>
          <Label>Photos</Label>
          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
              {photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.thumb} contentFit="cover" />
              ))}
            </ScrollView>
          ) : null}
          <Button
            variant="secondary"
            label={photos.length ? `Change photos (${photos.length})` : 'Pick photos'}
            busy={status === 'picking'}
            onPress={pickPhotos}
          />
          <Button
            label="Let Gemini write the page"
            busy={status === 'analyzing'}
            disabled={photos.length === 0}
            onPress={generate}
          />
          {source === 'demo' ? (
            <Banner tone="info" text="Gemini was unavailable — this is the demo fallback page." />
          ) : null}
          {source === 'gemini' && placeType ? (
            <Banner tone="info" text={`Gemini read these as: ${placeType}`} />
          ) : null}
        </View>

        <View style={styles.block}>
          <Label>Caption</Label>
          <TextInput
            style={styles.input}
            value={caption}
            onChangeText={setCaption}
            placeholder="One line about this place"
            placeholderTextColor={Colors.inkSoft}
          />
          <Label>Story</Label>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={story}
            onChangeText={setStory}
            multiline
            placeholder="What happened here"
            placeholderTextColor={Colors.inkSoft}
          />
          <Label>Tags (comma separated)</Label>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="coffee, slow morning"
            placeholderTextColor={Colors.inkSoft}
          />
          <Label>Postcard message</Label>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={postcard}
            onChangeText={setPostcard}
            multiline
            placeholder="What you would write on the back"
            placeholderTextColor={Colors.inkSoft}
          />
        </View>

        <Button label="Save to the shared map" busy={status === 'saving'} onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paper },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  block: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    fontSize: 15,
    color: Colors.ink,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  coords: { fontSize: 12, color: Colors.inkSoft },
  strip: { flexGrow: 0 },
  thumb: {
    width: 96,
    height: 124,
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.line,
  },
});
