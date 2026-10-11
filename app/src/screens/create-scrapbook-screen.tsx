import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { CollaborateSection } from '@/components/create/collaborate-section';
import { FormField, TextBox } from '@/components/create/form-field';
import { FormFooter } from '@/components/create/form-footer';
import { MediaPickerField } from '@/components/create/media-picker-field';
import { PhotoPickerField } from '@/components/create/photo-picker-field';
import { PreviewModal } from '@/components/create/preview-modal';
import { ScrapbookView } from '@/components/scrapbook/scrapbook-view';
import { Chip } from '@/components/ui/chip';
import { DeleteButton } from '@/components/ui/delete-button';
import { Notice } from '@/components/ui/notice';
import { TopBar } from '@/components/ui/top-bar';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { CATEGORIES } from '@/data/categories';
import { DEMO_USER_ID } from '@/data/content-source';
import { useAuth } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { useData } from '@/lib/data';
import { newId } from '@/lib/format';
import { saveSharedScrapbook } from '@/lib/scrapbook-api';
import { useDeletePost } from '@/lib/use-delete-post';
import { isCollaborator, isOwn } from '@/lib/visibility';
import { useAppStore } from '@/store/app-store';
import { useContent } from '@/store/content';
import { Colors, Gutter, Spacing } from '@/theme/tokens';
import type { CategoryId, Photo, PublishStatus, Scrapbook, ScrapbookMedia, User, Visibility } from '@/types';

const MIN_PHOTOS_TO_PUBLISH = 2;

type Errors = Partial<Record<'title' | 'media' | 'form', string>>;

export function CreateScrapbookScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const content = useContent();
  const upsertScrapbook = useAppStore((s) => s.upsertScrapbook);
  const markDeleted = useAppStore((s) => s.markDeleted);
  const { session, profile, getAccessToken } = useAuth();
  const { refresh } = useData();
  const { isSharedScrapbook } = useDeletePost();

  // Owners and collaborators can open the form; only owners change the details.
  const existing = params.id ? content.scrapbookById.get(params.id) : undefined;
  const editing = existing && isCollaborator(existing) ? existing : undefined;
  const isOwner = !editing || isOwn(editing);
  const online = Boolean(session && API_URL);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [city, setCity] = useState(editing?.city ?? 'Atlanta');
  const [category, setCategory] = useState<CategoryId | null>(editing?.categories[0] ?? null);
  const [cover, setCover] = useState<Photo | null>(editing?.cover ?? null);
  const [media, setMedia] = useState<ScrapbookMedia[]>(editing?.media ?? []);
  const [visibility, setVisibility] = useState<Visibility>(editing?.visibility ?? 'public');
  const [errors, setErrors] = useState<Errors>({});
  const [previewing, setPreviewing] = useState(false);
  const [posting, setPosting] = useState(false);

  const author = content.userById.get(editing?.authorId ?? DEMO_USER_ID);
  const collaborators = (editing?.collaboratorIds ?? [])
    .map((id) => content.userById.get(id))
    .filter((u): u is User => u !== undefined);
  // On a shared scrapbook, a collaborator can't change or remove other people's photos.
  const isLocked = (m: ScrapbookMedia) => Boolean(editing?.remote && !isOwner && m.authorId !== DEMO_USER_ID);

  const validate = (status: PublishStatus): boolean => {
    const found: Errors = {};
    if (!title.trim()) found.title = 'Give your scrapbook a title.';
    if (status === 'published' && media.length < MIN_PHOTOS_TO_PUBLISH) {
      found.media = `Add at least ${MIN_PHOTOS_TO_PUBLISH} photos to publish.`;
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const openPreview = () => {
    if (validate('published')) setPreviewing(true);
  };

  const fields = () => ({
    title: title.trim(),
    description: description.trim(),
    city: city.trim() || 'Atlanta',
    categories: category ? [category] : [],
    visibility,
    cover,
    media,
  });

  /** Published scrapbooks go to the server so friends can join; drafts (and offline use) stay on this device. */
  const save = async (status: PublishStatus) => {
    if (!validate(status)) return;

    if (status === 'published' && online) {
      setPosting(true);
      try {
        const token = await getAccessToken();
        const saved = await saveSharedScrapbook({ token, profile }, fields(), editing);
        // A local draft that is now on the server shouldn't linger as a duplicate.
        if (editing && !editing.remote) markDeleted(editing.id);
        await refresh();
        setPreviewing(false);
        router.replace({ pathname: '/scrapbook/[id]', params: { id: saved.id, justPublished: '1' } });
      } catch (err) {
        setPreviewing(false);
        setErrors({ form: err instanceof Error ? err.message : 'Could not save the scrapbook.' });
      } finally {
        setPosting(false);
      }
      return;
    }

    setPreviewing(false);
    const scrapbook: Scrapbook = {
      id: editing?.id ?? newId('sb'),
      ...fields(),
      authorId: DEMO_USER_ID,
      status,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      featured: editing?.featured,
    };
    upsertScrapbook(scrapbook);
    router.replace({ pathname: '/scrapbook/[id]', params: { id: scrapbook.id, justPublished: '1' } });
  };

  const canDelete = editing && isOwner && !isSharedScrapbook(editing.id);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar
        title={editing ? (isOwner ? 'Edit scrapbook' : 'Add your photos') : 'New scrapbook'}
        backIcon="close"
        right={canDelete ? <DeleteButton kind="scrapbook" id={editing.id} /> : null}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isOwner ? (
          <>
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
          </>
        ) : (
          <Notice
            icon="people-outline"
            message={`You’re collaborating on “${editing?.title}” by ${author?.name ?? 'a friend'}. Add your photos and captions; only the owner can change the details.`}
          />
        )}

        <FormField
          label={`Photos (${media.length})`}
          error={errors.media}
          hint="Shown in a photo grid in the order you add them. Captions appear under each photo.">
          <MediaPickerField
            media={media}
            onChange={setMedia}
            invalid={Boolean(errors.media)}
            isLocked={isLocked}
            lockedLabel={(m) => `Added by ${content.userById.get(m.authorId ?? '')?.name ?? 'a friend'}`}
          />
        </FormField>

        {isOwner ? (
          <>
            <FormField label="Cover" optional hint="If you skip this, your first photo is used.">
              <PhotoPickerField photo={cover} onChange={setCover} emptyLabel="Add a cover photo" />
            </FormField>

            <FormField label="Who can see it" hint="Friends you invite with the code can always see it.">
              <VisibilitySelector value={visibility} onChange={setVisibility} />
            </FormField>
          </>
        ) : null}

        <FormField label="Collaborate">
          <CollaborateSection
            online={online}
            scrapbookTitle={title.trim() || 'my scrapbook'}
            accessCode={editing?.accessCode}
            collaborators={collaborators}
            ownerId={editing?.authorId}
            showJoinLink={!editing}
          />
        </FormField>

        {errors.form ? <Notice icon="alert-circle-outline" tone="navy" message={errors.form} /> : null}
        {Object.keys(errors).length > 0 && !errors.form ? (
          <Notice icon="alert-circle-outline" tone="navy" message="A few things need attention." />
        ) : null}
      </ScrollView>
      <FormFooter
        onSaveDraft={editing?.remote ? undefined : () => save('draft')}
        onPublish={openPreview}
        publishLabel="Preview"
        publishing={posting}
        note={
          online
            ? 'Posting shares it with friends who have the code. Drafts stay on this device.'
            : 'Saved on this device only. Sign in to share it with friends.'
        }
      />

      {author ? (
        <PreviewModal
          visible={previewing}
          visibility={visibility}
          postLabel={editing?.status === 'published' ? 'Update' : 'Post'}
          onEdit={() => setPreviewing(false)}
          onPost={() => save('published')}
          posting={posting}
          fullBleed>
          <ScrapbookView
            title={title.trim()}
            description={description.trim()}
            city={city.trim() || 'Atlanta'}
            categories={category ? [category] : []}
            cover={cover ?? media[0]?.photo ?? null}
            media={media}
            author={author}
            isOwn={isOwner}
          />
        </PreviewModal>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Gutter, paddingBottom: Spacing.xxl, gap: Spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
