import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { FormField, TextBox } from '@/components/create/form-field';
import { FormFooter } from '@/components/create/form-footer';
import { MediaPickerField } from '@/components/create/media-picker-field';
import { PhotoPickerField } from '@/components/create/photo-picker-field';
import { Chip } from '@/components/ui/chip';
import { Notice } from '@/components/ui/notice';
import { TopBar } from '@/components/ui/top-bar';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { CATEGORIES } from '@/data/categories';
import { DEMO_USER_ID } from '@/data/content-source';
import { newId } from '@/lib/format';
import { isOwn } from '@/lib/visibility';
import { useAppStore } from '@/store/app-store';
import { useContent } from '@/store/content';
import { Colors, Gutter, Spacing } from '@/theme/tokens';
import type { CategoryId, Photo, PublishStatus, Scrapbook, ScrapbookMedia, Visibility } from '@/types';

const MIN_PHOTOS_TO_PUBLISH = 2;

type Errors = Partial<Record<'title' | 'media', string>>;

export function CreateScrapbookScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const content = useContent();
  const upsertScrapbook = useAppStore((s) => s.upsertScrapbook);

  const existing = params.id ? content.scrapbookById.get(params.id) : undefined;
  const editing = existing && isOwn(existing) ? existing : undefined;

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [city, setCity] = useState(editing?.city ?? 'Atlanta');
  const [category, setCategory] = useState<CategoryId | null>(editing?.categories[0] ?? null);
  const [cover, setCover] = useState<Photo | null>(editing?.cover ?? null);
  const [media, setMedia] = useState<ScrapbookMedia[]>(editing?.media ?? []);
  const [visibility, setVisibility] = useState<Visibility>(editing?.visibility ?? 'public');
  const [errors, setErrors] = useState<Errors>({});

  const save = (status: PublishStatus) => {
    const found: Errors = {};
    if (!title.trim()) found.title = 'Give your scrapbook a title.';
    if (status === 'published' && media.length < MIN_PHOTOS_TO_PUBLISH) {
      found.media = `Add at least ${MIN_PHOTOS_TO_PUBLISH} photos to publish.`;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const scrapbook: Scrapbook = {
      id: editing?.id ?? newId('sb'),
      title: title.trim(),
      description: description.trim(),
      city: city.trim() || 'Atlanta',
      authorId: DEMO_USER_ID,
      cover,
      categories: category ? [category] : [],
      media,
      visibility,
      status,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      featured: editing?.featured,
    };
    upsertScrapbook(scrapbook);
    router.replace({ pathname: '/scrapbook/[id]', params: { id: scrapbook.id, justPublished: '1' } });
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title={editing ? 'Edit scrapbook' : 'New scrapbook'} backIcon="close" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField label="Title" error={errors.title}>
          <TextBox
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Murals I keep coming back to"
            accessibilityLabel="Title"
            invalid={Boolean(errors.title)}
          />
        </FormField>

        <FormField label="Description" optional>
          <TextBox
            value={description}
            onChangeText={setDescription}
            placeholder="What’s the theme?"
            accessibilityLabel="Description"
            multiline
            maxLength={160}
          />
        </FormField>

        <FormField label="City">
          <TextBox value={city} onChangeText={setCity} placeholder="City" accessibilityLabel="City" />
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

        <FormField label={`Photos (${media.length})`} error={errors.media} hint="Shown as a collage in the order you add them.">
          <MediaPickerField media={media} onChange={setMedia} invalid={Boolean(errors.media)} />
        </FormField>

        <FormField label="Cover" optional hint="If you skip this, your first photo is used.">
          <PhotoPickerField photo={cover} onChange={setCover} emptyLabel="Add a cover photo" />
        </FormField>

        <FormField label="Who can see it">
          <VisibilitySelector value={visibility} onChange={setVisibility} />
        </FormField>

        {Object.keys(errors).length > 0 ? (
          <Notice icon="alert-circle-outline" tone="navy" message="A few things need attention." />
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
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Gutter, paddingBottom: Spacing.xxl, gap: Spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
