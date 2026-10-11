import type { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Colors, Gutter, Spacing } from '@/theme/tokens';
import type { Visibility } from '@/types';

interface PreviewModalProps {
  visible: boolean;
  visibility: Visibility;
  postLabel: string;
  onEdit: () => void;
  onPost: () => void;
  /** Lay content out edge to edge (scrapbooks) instead of inside the page gutter (postcards). */
  fullBleed?: boolean;
  children: ReactNode;
}

/** Full-screen "this is how it will look" step before posting. */
export function PreviewModal({ visible, visibility, postLabel, onEdit, onPost, fullBleed, children }: PreviewModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onEdit}>
      <View style={styles.screen}>
        <View style={[styles.bar, { paddingTop: insets.top + Spacing.sm }]}>
          <IconButton icon="arrow-back" label="Keep editing" onPress={onEdit} variant="clear" />
          <View style={styles.barText}>
            <AppText variant="subheading">Preview</AppText>
            <AppText variant="caption">
              {visibility === 'public' ? 'This is how others will see it' : 'Private: only you will see it'}
            </AppText>
          </View>
          <View style={styles.barSpacer} />
        </View>
        <ScrollView contentContainerStyle={[!fullBleed && styles.padded, { paddingBottom: Spacing.xxl }]}>{children}</ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Button label="Keep editing" variant="secondary" onPress={onEdit} flex />
          <Button label={postLabel} icon="paper-plane-outline" onPress={onPost} flex />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Gutter - 8,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
    backgroundColor: Colors.surface,
  },
  barText: { flex: 1, alignItems: 'center' },
  barSpacer: { width: 44 },
  padded: { paddingHorizontal: Gutter, paddingTop: Spacing.lg },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Gutter,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
  },
});
