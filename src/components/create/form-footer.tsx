import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors, Gutter, Spacing } from '@/theme/tokens';

interface FormFooterProps {
  onSaveDraft: () => void;
  onPublish: () => void;
  publishLabel: string;
}

export function FormFooter({ onSaveDraft, onPublish, publishLabel }: FormFooterProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
      <View style={styles.buttons}>
        <Button label="Save draft" variant="secondary" onPress={onSaveDraft} flex />
        <Button label={publishLabel} onPress={onPublish} flex />
      </View>
      <AppText variant="caption" style={styles.note}>
        Prototype: saved on this device only, not shared with other people yet.
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
