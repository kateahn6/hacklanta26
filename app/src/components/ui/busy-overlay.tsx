import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Radius, Spacing } from '@/theme/tokens';

interface BusyOverlayProps {
  title: string;
  /** Shown once the wait gets long, so a slow call does not look like a hang. */
  patienceNote?: string;
}

/**
 * Gemini calls run from about 4 to 20 seconds. A spinner inside the button is
 * too small to read as progress over that long, so this covers the screen and
 * starts explaining itself once the wait gets uncomfortable.
 *
 * Render it conditionally (`{busy ? <BusyOverlay … /> : null}`) rather than
 * passing a `visible` flag: mounting per call is what resets the timer.
 */
export function BusyOverlay({ title, patienceNote }: BusyOverlayProps) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={Colors.navy} />
          <AppText variant="subheading" style={styles.title}>
            {title}
          </AppText>
          {slow && patienceNote ? (
            <AppText variant="caption" style={styles.note}>
              {patienceNote}
            </AppText>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    alignItems: 'center',
    minWidth: 240,
  },
  title: { textAlign: 'center' },
  note: { textAlign: 'center' },
});
