import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors, Gutter, Spacing } from '@/theme/tokens';

interface FormFooterProps {
  /** Omit to hide "Save draft" (shared scrapbooks have no local drafts). */
  onSaveDraft?: () => void;
  onPublish: () => void;
  publishLabel: string;
  /** Set while the publish is in flight (saving to the shared map). */
  publishing?: boolean;
  /** Overrides the default footnote. */
  note?: string;
}

export function FormFooter({ onSaveDraft, onPublish, publishLabel, publishing, note }: FormFooterProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
      <View style={styles.buttons}>
        {onSaveDraft ? <Button label="Save draft" variant="secondary" onPress={onSaveDraft} flex disabled={publishing} /> : null}
        <Button label={publishLabel} onPress={onPublish} flex loading={publishing} />
      </View>
      <AppText variant="caption" style={styles.note}>
        {note ?? 'Publishing saves to the shared map and records a visit. Drafts stay on this device.'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: Spacing.sm,
    paddingHorizontal: Gutter,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
  },
  buttons: { flexDirection: 'row', gap: Spacing.sm },
  note: { textAlign: 'center' },
});
