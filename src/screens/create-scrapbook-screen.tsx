import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { FormField, TextBox } from '@/components/create/form-field';
import { FormFooter } from '@/components/create/form-footer';
import { PhotoPickerField } from '@/components/create/photo-picker-field';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import { PhotoView } from '@/components/ui/photo-view';
import { TopBar } from '@/components/ui/top-bar';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { DEMO_USER_ID } from '@/data/content-source';
import { newId } from '@/lib/format';
import { isOwn } from '@/lib/visibility';
import { useAppStore } from '@/store/app-store';
import { useContent } from '@/store/content';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';
import type { PublishStatus, Scrapbook } from '@/types';

const MIN_STOPS_TO_PUBLISH = 2;

type Errors = Partial<Record<'title' | 'stops', string>>;

export function CreateScrapbookScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const content = useContent();
  const composer = useAppStore((s) => s.composer);
  const startComposer = useAppStore((s) => s.startComposer);
  const updateComposer = useAppStore((s) => s.updateComposer);
  const removeStop = useAppStore((s) => s.removeComposerStop);
  const moveStop = useAppStore((s) => s.moveComposerStop);
  const clearComposer = useAppStore((s) => s.clearComposer);
  const upsertScrapbook = useAppStore((s) => s.upsertScrapbook);
  const defaultVisibility = useAppStore((s) => s.defaultVisibility);
  const [errors, setErrors] = useState<Errors>({});

  const existing = params.id ? content.scrapbookById.get(params.id) : undefined;
  const editing = existing && isOwn(existing) ? existing : undefined;

  // Start a fresh form each time this screen opens. The add-postcard screens write into it.
  useEffect(() => {
    startComposer({
      editingId: editing?.id ?? null,
      title: editing?.title ?? '',
      description: editing?.description ?? '',
      city: editing?.city ?? 'Atlanta',
      cover: editing?.cover ?? null,
      visibility: editing?.visibility ?? defaultVisibility,
      stops: editing?.stops ?? [],
    });
    // Only on open; later edits flow through the composer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!composer) return <View style={styles.screen} />;

  const close = () => {
    clearComposer();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const save = (status: PublishStatus) => {
    const found: Errors = {};
    if (!composer.title.trim()) found.title = 'Give your scrapbook a title.';
    if (status === 'published' && composer.stops.length < MIN_STOPS_TO_PUBLISH) {
      found.stops = `Add at least ${MIN_STOPS_TO_PUBLISH} postcards to publish.`;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const scrapbook: Scrapbook = {
      id: composer.editingId ?? newId('sb'),
      title: composer.title.trim(),
      description: composer.description.trim(),
      city: composer.city.trim() || 'Atlanta',
      authorId: DEMO_USER_ID,
      cover: composer.cover,
      stops: composer.stops,
      visibility: composer.visibility,
      status,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      featured: editing?.featured,
    };
    upsertScrapbook(scrapbook);
    clearComposer();
    router.replace({ pathname: '/scrapbook/[id]', params: { id: scrapbook.id, justPublished: '1' } });
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title={editing ? 'Edit scrapbook' : 'New scrapbook'} backIcon="close" onBack={close} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField label="Title" error={errors.title}>
          <TextBox
            value={composer.title}
            onChangeText={(title) => updateComposer({ title })}
            placeholder="e.g. A slow Sunday in Inman Park"
            accessibilityLabel="Title"
            invalid={Boolean(errors.title)}
          />
        </FormField>

        <FormField label="Description" optional>
          <TextBox
            value={composer.description}
            onChangeText={(description) => updateComposer({ description })}
            placeholder="What ties these places together?"
            accessibilityLabel="Description"
            multiline
            maxLength={160}
          />
        </FormField>

        <FormField label="City">
          <TextBox value={composer.city} onChangeText={(city) => updateComposer({ city })} accessibilityLabel="City" />
        </FormField>

        <FormField label="Cover" optional hint="If you skip this, the first postcard’s photo is used.">
          <PhotoPickerField photo={composer.cover} onChange={(cover) => updateComposer({ cover })} emptyLabel="Add a cover photo" />
        </FormField>

        <FormField label={`Postcards (${composer.stops.length})`} error={errors.stops} hint="Arrange them in the order you’d visit.">
          {composer.stops.map((stop, index) => {
            const postcard = content.postcardById.get(stop.postcardId);
            const place = postcard && content.placeById.get(postcard.placeId);
            return (
              <View key={stop.postcardId} style={styles.stop}>
                <AppText variant="label" color={Colors.cherry} style={styles.index}>
                  {index + 1}
                </AppText>
                <PhotoView photo={postcard?.photo ?? null} aspect={1} style={styles.thumb} />
                <View style={styles.flex}>
                  <AppText variant="label" numberOfLines={1}>
                    {place?.name ?? 'Postcard'}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    {postcard?.note}
                  </AppText>
                </View>
                {index > 0 ? (
                  <IconButton icon="arrow-up" label={`Move ${place?.name ?? 'postcard'} up`} size={34} variant="clear" onPress={() => moveStop(index, -1)} />
                ) : null}
                {index < composer.stops.length - 1 ? (
                  <IconButton icon="arrow-down" label={`Move ${place?.name ?? 'postcard'} down`} size={34} variant="clear" onPress={() => moveStop(index, 1)} />
                ) : null}
                <IconButton icon="close" label={`Remove ${place?.name ?? 'postcard'}`} size={34} variant="clear" onPress={() => removeStop(index)} />
              </View>
            );
          })}
          <View style={styles.addRow}>
            <Button label="Add existing" icon="albums-outline" variant="secondary" flex onPress={() => router.push('/create/pick-postcards')} />
            <Button
              label="New postcard"
              icon="add"
              variant="secondary"
              flex
              onPress={() => router.push({ pathname: '/create/postcard', params: { forScrapbook: '1' } })}
            />
          </View>
        </FormField>

        <FormField label="Who can see it">
          <VisibilitySelector value={composer.visibility} onChange={(visibility) => updateComposer({ visibility })} />
        </FormField>

        {Object.keys(errors).length > 0 ? (
          <Notice icon="alert-circle-outline" tone="cherry" message="A few things need attention." />
        ) : null}
      </ScrollView>
      <FormFooter onSaveDraft={() => save('draft')} onPublish={() => save('published')} publishLabel={editing?.status === 'published' ? 'Update' : 'Publish'} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  content: { paddingHorizontal: Gutter, paddingBottom: Spacing.xxl, gap: Spacing.xl },
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.paper,
  },
  index: { width: 18, textAlign: 'center' },
  thumb: { width: 44, borderRadius: Radius.sm },
  addRow: { flexDirection: 'row', gap: Spacing.sm },
});
